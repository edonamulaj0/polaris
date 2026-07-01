import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../types';
import type {
  ExtendedModerationState,
  ModerationResult,
  ViolationSeverity,
  ViolationType,
} from '../types/moderation';
import { TIMEOUT_MESSAGE_PREFIX, WARNING_MESSAGE } from '../types/moderation';
import { sendSocialBanEmail } from './moderationEmail';

const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
const TIMEOUT_24H = 24 * 60 * 60;
const TIMEOUT_72H = 72 * 60 * 60;

export async function generateId(prefix: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${prefix}:${Date.now()}:${crypto.randomUUID()}`),
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}-${hashHex.slice(0, 12)}`;
}

function isTimedOut(timeoutUntil: number | null): boolean {
  if (!timeoutUntil) return false;
  return timeoutUntil > Math.floor(Date.now() / 1000);
}

export async function getUserModerationState(
  db: D1Database,
  userId: string,
): Promise<ExtendedModerationState> {
  const row = await db
    .prepare(
      `SELECT strike_count, comment_blocked, banned, warning_count, timeout_count,
              timeout_until, social_banned
       FROM user_moderation_state WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{
      strike_count: number;
      comment_blocked: number;
      banned: number;
      warning_count: number;
      timeout_count: number;
      timeout_until: number | null;
      social_banned: number;
    }>();

  if (!row) {
    return {
      strikeCount: 0,
      commentBlocked: false,
      banned: false,
      warningCount: 0,
      timeoutCount: 0,
      timeoutUntil: null,
      socialBanned: false,
      canComment: true,
      canPostTopics: true,
      canVote: true,
    };
  }

  const socialBanned = row.social_banned === 1 || row.banned === 1;
  const timedOut = isTimedOut(row.timeout_until);
  const interactionBlocked = socialBanned || timedOut || row.comment_blocked === 1;

  return {
    strikeCount: row.strike_count,
    commentBlocked: row.comment_blocked === 1 || timedOut,
    banned: socialBanned,
    warningCount: row.warning_count ?? 0,
    timeoutCount: row.timeout_count ?? 0,
    timeoutUntil: row.timeout_until,
    socialBanned,
    canComment: !interactionBlocked && !socialBanned,
    canPostTopics: !socialBanned && !timedOut,
    canVote: !socialBanned,
  };
}

export async function recalculateModerationState(
  db: D1Database,
  userId: string,
): Promise<void> {
  const countRow = await db
    .prepare(`SELECT COUNT(*) as n FROM user_strikes WHERE user_id = ?`)
    .bind(userId)
    .first<{ n: number }>();

  const strikeCount = countRow?.n ?? 0;
  const now = Math.floor(Date.now() / 1000);

  const existing = await db
    .prepare(
      `SELECT warning_count, timeout_count, timeout_until, social_banned FROM user_moderation_state WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{
      warning_count: number;
      timeout_count: number;
      timeout_until: number | null;
      social_banned: number;
    }>();

  const commentBlocked =
    (existing?.social_banned === 1 ? 1 : 0) ||
    (existing?.timeout_until && existing.timeout_until > now ? 1 : 0) ||
    (strikeCount >= 3 ? 1 : 0);

  const banned = existing?.social_banned === 1 || strikeCount >= 5 ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO user_moderation_state (
         user_id, strike_count, comment_blocked, banned,
         warning_count, timeout_count, timeout_until, social_banned, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         strike_count = excluded.strike_count,
         comment_blocked = CASE
           WHEN user_moderation_state.social_banned = 1 THEN 1
           WHEN user_moderation_state.timeout_until IS NOT NULL
             AND user_moderation_state.timeout_until > unixepoch() THEN 1
           ELSE excluded.comment_blocked
         END,
         banned = CASE
           WHEN user_moderation_state.social_banned = 1 THEN 1
           ELSE excluded.banned
         END,
         updated_at = excluded.updated_at`,
    )
    .bind(
      userId,
      strikeCount,
      commentBlocked,
      banned,
      existing?.warning_count ?? 0,
      existing?.timeout_count ?? 0,
      existing?.timeout_until ?? null,
      existing?.social_banned ?? 0,
      now,
    )
    .run();
}

export async function issueStrike(
  db: D1Database,
  userId: string,
  commentId: string,
  reason: string,
  issuedBy: 'bot' | 'editor',
): Promise<void> {
  const strikeId = await generateId('str');
  await db.batch([
    db
      .prepare(
        `INSERT INTO user_strikes (id, user_id, comment_id, reason, issued_by) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(strikeId, userId, commentId, reason, issuedBy),
  ]);
  await recalculateModerationState(db, userId);
}

export async function insertCommentFlags(
  db: D1Database,
  commentId: string,
  result: ModerationResult,
  flaggedBy: 'bot' | 'editor',
): Promise<void> {
  const flags =
    result.flags.length > 0
      ? result.flags
      : [
          {
            type: 'borderline' as const,
            confidence: 0.5,
            reasoning: result.primaryReason ?? 'Flagged by moderation bot.',
          },
        ];

  const statements = await Promise.all(
    flags.map(async (flag) => {
      const flagId = await generateId('flg');
      return db
        .prepare(
          `INSERT INTO comment_flags (id, comment_id, flagged_by, flag_type, confidence, reasoning)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(flagId, commentId, flaggedBy, flag.type, flag.confidence, flag.reasoning);
    }),
  );

  await db.batch(statements);
}

export async function logViolation(
  db: D1Database,
  userId: string,
  commentId: string | null,
  violationType: ViolationType,
  triggerReason: string,
  severity: ViolationSeverity | null,
  penaltyApplied: string | null,
): Promise<void> {
  const id = await generateId('vio');
  await db
    .prepare(
      `INSERT INTO moderation_violations
       (id, user_id, comment_id, violation_type, trigger_reason, severity, penalty_applied)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, commentId, violationType, triggerReason, severity, penaltyApplied)
    .run();
}

async function countRecentWarnings(db: D1Database, userId: string): Promise<number> {
  const since = Math.floor(Date.now() / 1000) - THIRTY_DAYS_SEC;
  const row = await db
    .prepare(
      `SELECT COUNT(*) as n FROM moderation_violations
       WHERE user_id = ? AND violation_type = 'warning' AND created_at >= ?`,
    )
    .bind(userId, since)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function applyTimeout(
  db: D1Database,
  userId: string,
  durationSec: number,
  reason: string,
): Promise<{ timeoutUntil: number; timeoutCount: number }> {
  const now = Math.floor(Date.now() / 1000);
  const timeoutUntil = now + durationSec;

  const row = await db
    .prepare(`SELECT timeout_count FROM user_moderation_state WHERE user_id = ?`)
    .bind(userId)
    .first<{ timeout_count: number }>();

  const timeoutCount = (row?.timeout_count ?? 0) + 1;

  await db
    .prepare(
      `INSERT INTO user_moderation_state (
         user_id, strike_count, comment_blocked, banned,
         warning_count, timeout_count, timeout_until, social_banned, updated_at
       )
       VALUES (?, 0, 1, 0, 0, ?, ?, 0, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         comment_blocked = 1,
         timeout_count = excluded.timeout_count,
         timeout_until = excluded.timeout_until,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, timeoutCount, timeoutUntil, now)
    .run();

  await logViolation(db, userId, null, 'timeout', reason, 'moderate', `Suspended until ${timeoutUntil}`);

  return { timeoutUntil, timeoutCount };
}

async function applySocialBan(
  db: D1Database,
  env: Env,
  userId: string,
  commentId: string | null,
  reason: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT INTO user_moderation_state (
         user_id, strike_count, comment_blocked, banned,
         warning_count, timeout_count, timeout_until, social_banned, updated_at
       )
       VALUES (?, 0, 1, 1, 0, 0, NULL, 1, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         comment_blocked = 1,
         banned = 1,
         social_banned = 1,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, now)
    .run();

  await logViolation(
    db,
    userId,
    commentId,
    'social_ban',
    reason,
    'extreme',
    'Permanent social interaction ban',
  );

  const user = await db
    .prepare(`SELECT email, name FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ email: string; name: string }>();

  if (user?.email) {
    await sendSocialBanEmail(env, user.email, user.name || 'User');
  }
}

function isReviewFlag(result: ModerationResult): boolean {
  return result.flags.some((f) =>
    ['masking_bypass', 'irony', 'sarcasm', 'borderline'].includes(f.type),
  );
}

export interface PenaltyOutcome {
  warningIssued: boolean;
  timeoutUntil: number | null;
  socialBanned: boolean;
  message: string | null;
}

export async function applyModerationPenalty(
  db: D1Database,
  env: Env,
  userId: string,
  commentId: string,
  result: ModerationResult,
): Promise<PenaltyOutcome> {
  const outcome: PenaltyOutcome = {
    warningIssued: false,
    timeoutUntil: null,
    socialBanned: false,
    message: null,
  };

  const state = await getUserModerationState(db, userId);
  if (state.socialBanned) return outcome;

  if (result.action === 'auto_delete') {
    await logViolation(
      db,
      userId,
      commentId,
      'auto_delete',
      result.primaryReason ?? 'Auto-deleted by moderation',
      result.severity,
      null,
    );

    if (result.severity === 'extreme') {
      await applySocialBan(
        db,
        env,
        userId,
        commentId,
        result.primaryReason ?? 'Severe policy violation',
      );
      outcome.socialBanned = true;
      outcome.message =
        'Your account has been permanently banned from participating due to a severe violation.';
      return outcome;
    }

    if (result.severity === 'moderate') {
      const duration = state.timeoutCount >= 1 ? TIMEOUT_72H : TIMEOUT_24H;
      const { timeoutUntil, timeoutCount } = await applyTimeout(
        db,
        userId,
        duration,
        result.primaryReason ?? 'Moderate policy violation',
      );
      outcome.timeoutUntil = timeoutUntil;

      if (timeoutCount >= 3) {
        await applySocialBan(
          db,
          env,
          userId,
          commentId,
          'Third temporary timeout — permanent social ban',
        );
        outcome.socialBanned = true;
        outcome.message =
          'Your account has been permanently banned from participating after repeated violations.';
      } else {
        outcome.message = `${TIMEOUT_MESSAGE_PREFIX} ${new Date(timeoutUntil * 1000).toISOString()} due to a violation of our community guidelines.`;
      }
      return outcome;
    }

    return outcome;
  }

  if (result.action === 'flag' && isReviewFlag(result)) {
    await logViolation(
      db,
      userId,
      commentId,
      'flagged_review',
      result.flags[0]?.reasoning ?? 'Flagged for editor review',
      result.severity,
      null,
    );

    const recentWarnings = await countRecentWarnings(db, userId);
    const now = Math.floor(Date.now() / 1000);

    if (recentWarnings === 0) {
      await db
        .prepare(
          `INSERT INTO user_moderation_state (
             user_id, strike_count, comment_blocked, banned,
             warning_count, timeout_count, timeout_until, social_banned, updated_at
           )
           VALUES (?, 0, 0, 0, 1, 0, NULL, 0, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             warning_count = warning_count + 1,
             updated_at = excluded.updated_at`,
        )
        .bind(userId, now)
        .run();

      await logViolation(
        db,
        userId,
        commentId,
        'warning',
        result.flags[0]?.reasoning ?? 'First review-flag violation',
        result.severity,
        'Formal warning issued',
      );

      outcome.warningIssued = true;
      outcome.message = WARNING_MESSAGE;
      return outcome;
    }

    if (recentWarnings >= 1) {
      const duration = state.timeoutCount >= 1 ? TIMEOUT_72H : TIMEOUT_24H;
      const { timeoutUntil, timeoutCount } = await applyTimeout(
        db,
        userId,
        duration,
        'Repeat review-flag offense within 30 days',
      );
      outcome.timeoutUntil = timeoutUntil;

      if (timeoutCount >= 3) {
        await applySocialBan(
          db,
          env,
          userId,
          commentId,
          'Third temporary timeout — permanent social ban',
        );
        outcome.socialBanned = true;
        outcome.message =
          'Your account has been permanently banned from participating after repeated violations.';
      } else {
        outcome.message = `${TIMEOUT_MESSAGE_PREFIX} ${new Date(timeoutUntil * 1000).toISOString()} due to a violation of our community guidelines.`;
      }
    }
  }

  return outcome;
}

export async function checkRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
): Promise<boolean> {
  if (!kv) return true;
  const key = `comments:ratelimit:${userId}`;
  const existing = await kv.get(key);
  if (existing) return false;
  await kv.put(key, '1', { expirationTtl: 5 });
  return true;
}

export function formatTimeoutMessage(timeoutUntil: number): string {
  return `${TIMEOUT_MESSAGE_PREFIX} ${new Date(timeoutUntil * 1000).toLocaleString()} due to a violation of our community guidelines.`;
}

export { WARNING_MESSAGE, TIMEOUT_MESSAGE_PREFIX };
