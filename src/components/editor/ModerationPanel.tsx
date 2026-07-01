import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import {
  IoCheckmarkOutline,
  IoFlagOutline,
  IoRefreshOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import type { FlaggedCommentItem, FlagType } from '../../types/moderation';

const FLAG_COLORS: Record<FlagType, string> = {
  offensive: 'bg-red-500/20 text-red-400 border-red-500/40',
  sarcasm: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  irony: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  borderline: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  masking_bypass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  false_positive: 'bg-[var(--surface-hi)] text-[var(--muted)] border-[var(--border)]',
};

const FLAG_DISPLAY: Record<FlagType, string> = {
  offensive: 'Offensive content',
  sarcasm: 'Potential sarcasm / personal attack',
  irony: 'Potential irony / sarcasm',
  borderline: 'Borderline language',
  masking_bypass: 'Bypassed filter via masking/asterisks',
  false_positive: 'False positive',
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

async function fetchFlagged() {
  const res = await fetch('/api/editor/comments/flagged?limit=50');
  if (!res.ok) throw new Error('Failed to load flagged comments');
  return res.json() as Promise<{
    items: FlaggedCommentItem[];
    flaggedCount: number;
    nextCursor: string | null;
  }>;
}

async function fetchContext(commentId: string) {
  const res = await fetch(`/api/editor/comments/${encodeURIComponent(commentId)}/context`);
  if (!res.ok) throw new Error('Failed to load context');
  return res.json();
}

async function postAction(
  commentId: string,
  action: 'delete' | 'clear' | 'false_positive' | 'approve' | 'permanently_delete',
) {
  const res = await fetch(`/api/editor/comments/${encodeURIComponent(commentId)}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Action failed');
  return res.json();
}

function FlagBadge({
  type,
  confidence,
  label,
}: {
  type: FlagType;
  confidence: number;
  label?: string;
}) {
  const display = label ?? FLAG_DISPLAY[type] ?? type;
  return (
    <div className="space-y-1">
      <span
        className={`inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${FLAG_COLORS[type] ?? FLAG_COLORS.borderline}`}
      >
        {display}
      </span>
      <div className="h-1 w-20 overflow-hidden bg-[var(--surface-hi)]">
        <div
          className="h-full bg-[var(--signal)]"
          style={{ width: `${Math.round(confidence * 100)}%` }}
        />
      </div>
      <span className="font-mono text-[8px] text-[var(--muted)]">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}

export function ModerationPanel() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});
  const [showStrikes, setShowStrikes] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['editor-flagged'],
    queryFn: fetchFlagged,
    refetchInterval: 30000,
  });

  const selected = data?.items.find((i) => i.comment.id === selectedId) ?? data?.items[0] ?? null;

  const { data: context } = useQuery({
    queryKey: ['editor-context', selected?.comment.id],
    queryFn: () => fetchContext(selected!.comment.id),
    enabled: Boolean(selected?.comment.id),
  });

  const actionMutation = useMutation({
    mutationFn: ({
      commentId,
      action,
    }: {
      commentId: string;
      action: 'delete' | 'clear' | 'false_positive' | 'approve' | 'permanently_delete';
    }) => postAction(commentId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-flagged'] });
      queryClient.invalidateQueries({ queryKey: ['editor-context'] });
    },
  });

  const flaggedCount = data?.flaggedCount ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-wide">
          {flaggedCount} comment{flaggedCount === 1 ? '' : 's'} pending review
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 border border-[var(--border)] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wide text-[var(--muted)] hover:text-[var(--signal)]"
        >
          <IoRefreshOutline className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading && (
        <p className="py-12 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
          Loading moderation queue…
        </p>
      )}

      {!isLoading && (data?.items.length ?? 0) === 0 && (
        <p className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
          No comments pending review — the queue is clear.
        </p>
      )}

      {(data?.items.length ?? 0) > 0 && (
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {data!.items.map((item) => {
              const isSelected = (selectedId ?? selected?.comment.id) === item.comment.id;
              const expanded = expandedBodies[item.comment.id];
              const body = expanded
                ? item.comment.body
                : truncate(item.comment.body, 200);

              return (
                <button
                  key={item.comment.id}
                  type="button"
                  onClick={() => setSelectedId(item.comment.id)}
                  className={`w-full text-left border p-4 transition-colors ${
                    isSelected
                      ? 'border-[var(--signal)] bg-[var(--surface-hi)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--signal)]/40'
                  }`}
                >
                  <p className="mb-2 text-sm leading-relaxed text-[var(--text)]">{body}</p>
                  {item.comment.body.length > 200 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBodies((prev) => ({
                          ...prev,
                          [item.comment.id]: !prev[item.comment.id],
                        }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          setExpandedBodies((prev) => ({
                            ...prev,
                            [item.comment.id]: !prev[item.comment.id],
                          }));
                        }
                      }}
                      className="font-mono text-[9px] uppercase tracking-wide text-[var(--signal)]"
                    >
                      {expanded ? 'Show less' : 'Show more'}
                    </span>
                  )}
                  <p className="mt-2 font-mono text-[9px] text-[var(--muted)]">
                    {item.comment.username} ·{' '}
                    <a
                      href={`/discussion/${item.comment.debateId}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[var(--signal)] hover:underline"
                    >
                      {item.comment.debateTitle}
                    </a>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {item.flags.map((f) => (
                      <FlagBadge
                        key={f.id}
                        type={(f.type ?? f.flagType) as FlagType}
                        confidence={f.confidence}
                        label={f.label}
                      />
                    ))}
                  </div>
                  {item.flags[0]?.reasoning && (
                    <p className="mt-3 text-xs italic text-[var(--muted)]">
                      {item.flags[0].reasoning}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actionMutation.mutate({
                          commentId: item.comment.id,
                          action: 'permanently_delete',
                        });
                      }}
                      disabled={actionMutation.isPending}
                      className="flex items-center gap-1 bg-red-600/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      <IoTrashOutline className="h-3.5 w-3.5" />
                      Permanently Delete
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actionMutation.mutate({ commentId: item.comment.id, action: 'approve' });
                      }}
                      disabled={actionMutation.isPending}
                      className="flex items-center gap-1 bg-emerald-600/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-white disabled:opacity-50"
                    >
                      <IoCheckmarkOutline className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actionMutation.mutate({
                          commentId: item.comment.id,
                          action: 'false_positive',
                        });
                      }}
                      disabled={actionMutation.isPending}
                      className="flex items-center gap-1 border border-[var(--border)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"
                    >
                      <IoFlagOutline className="h-3.5 w-3.5" />
                      False Positive
                    </button>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border border-[var(--border)] bg-[var(--surface)] p-5 max-h-[70vh] overflow-y-auto">
            {selected && context ? (
              <>
                <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--signal)]">
                  Context — {selected.comment.debateTitle}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[var(--text)]">
                  {selected.comment.body}
                </p>
                <div className="mb-4 flex flex-wrap gap-3">
                  {context.flags.map(
                    (f: {
                      id: string;
                      type: FlagType;
                      label?: string;
                      confidence: number;
                      reasoning: string;
                    }) => (
                      <div key={f.id}>
                        <FlagBadge type={f.type} confidence={f.confidence} label={f.label} />
                        <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">{f.reasoning}</p>
                      </div>
                    ),
                  )}
                </div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-wide text-[var(--muted)]">
                  Thread
                </p>
                <ul className="mb-6 space-y-2">
                  {context.thread.map(
                    (t: {
                      id: string;
                      body: string;
                      username: string;
                      highlighted?: boolean;
                      createdAt: number;
                    }) => (
                      <li
                        key={t.id}
                        className={`border-l-2 pl-3 text-sm ${
                          t.highlighted
                            ? 'border-[var(--signal)] bg-[var(--surface-hi)] py-2'
                            : 'border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        <span className="font-mono text-[9px] text-[var(--text-hi)]">
                          {t.username}
                        </span>{' '}
                        <span className="font-mono text-[8px] text-[var(--muted)]">
                          {formatDistanceToNow(new Date(t.createdAt * 1000), { addSuffix: true })}
                        </span>
                        <p className="mt-0.5">{t.body}</p>
                      </li>
                    ),
                  )}
                </ul>
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--muted)]">
                    Author moderation
                  </p>
                  <p className="mt-1 text-sm text-[var(--text)]">
                    {context.userState.strikeCount} strike
                    {context.userState.strikeCount === 1 ? '' : 's'}
                    {context.userState.warningCount != null &&
                      ` · ${context.userState.warningCount} warning${context.userState.warningCount === 1 ? '' : 's'}`}
                    {context.userState.timeoutCount != null &&
                      context.userState.timeoutCount > 0 &&
                      ` · ${context.userState.timeoutCount} timeout${context.userState.timeoutCount === 1 ? '' : 's'}`}
                    {context.userState.commentBlocked && ' · commenting suspended'}
                    {(context.userState.socialBanned || context.userState.banned) &&
                      ' · social ban active'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowStrikes(true)}
                      className="font-mono text-[9px] uppercase tracking-wide text-[var(--signal)] hover:underline"
                    >
                      Strike history
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowViolations(true)}
                      className="font-mono text-[9px] uppercase tracking-wide text-[var(--signal)] hover:underline"
                    >
                      Violation log (appeals)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                Select a flagged comment to view context.
              </p>
            )}
          </div>
        </div>
      )}

      {showStrikes && selected && (
        <StrikeHistoryModal
          userId={selected.comment.userId!}
          onClose={() => setShowStrikes(false)}
        />
      )}

      {showViolations && selected && (
        <ViolationHistoryModal
          userId={selected.comment.userId!}
          onClose={() => setShowViolations(false)}
        />
      )}
    </div>
  );
}

function ViolationHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['editor-violations', userId],
    queryFn: async () => {
      const res = await fetch(`/api/editor/users/${encodeURIComponent(userId)}/violations`);
      if (!res.ok) throw new Error('Failed to load violations');
      return res.json();
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--signal)]">
            Violation log
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[9px] uppercase text-[var(--muted)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </div>
        {isLoading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {data && (
          <>
            <p className="mb-4 text-sm text-[var(--text)]">
              {data.violations.length} recorded violation
              {data.violations.length === 1 ? '' : 's'}
            </p>
            <ul className="space-y-3">
              {data.violations.map(
                (v: {
                  id: string;
                  type: string;
                  triggerReason: string;
                  severity: string | null;
                  penaltyApplied: string | null;
                  createdAt: number;
                  commentBody: string | null;
                  debateTitle: string | null;
                }) => (
                  <li key={v.id} className="border border-[var(--border)] p-3 text-sm">
                    <p className="font-mono text-[9px] uppercase text-[var(--signal)]">
                      {v.type.replace(/_/g, ' ')}
                      {v.severity ? ` · ${v.severity}` : ''}
                    </p>
                    <p className="mt-1 text-[var(--text)]">{v.triggerReason}</p>
                    {v.penaltyApplied && (
                      <p className="mt-1 text-xs text-amber-400/90">Penalty: {v.penaltyApplied}</p>
                    )}
                    {v.commentBody && (
                      <p className="mt-1 text-xs italic text-[var(--muted)]">
                        &ldquo;{truncate(v.commentBody, 120)}&rdquo;
                        {v.debateTitle ? ` — ${v.debateTitle}` : ''}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-[8px] text-[var(--muted)]">
                      {formatDistanceToNow(new Date(v.createdAt * 1000), { addSuffix: true })}
                    </p>
                  </li>
                ),
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function StrikeHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['editor-strikes', userId],
    queryFn: async () => {
      const res = await fetch(`/api/editor/users/${encodeURIComponent(userId)}/strikes`);
      if (!res.ok) throw new Error('Failed to load strikes');
      return res.json();
    },
  });

  const pardonMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/editor/users/${encodeURIComponent(userId)}/pardon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Editor pardon' }),
      });
      if (!res.ok) throw new Error('Pardon failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-strikes', userId] });
      queryClient.invalidateQueries({ queryKey: ['editor-flagged'] });
      queryClient.invalidateQueries({ queryKey: ['editor-context'] });
    },
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--signal)]">
            Strike history
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[9px] uppercase text-[var(--muted)] hover:text-[var(--text)]"
          >
            Close
          </button>
        </div>
        {isLoading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {data && (
          <>
            <p className="mb-4 text-sm text-[var(--text)]">
              {data.userState.strikeCount} total strikes
            </p>
            <ul className="mb-4 space-y-3">
              {data.strikes.map(
                (s: {
                  id: string;
                  reason: string;
                  issuedBy: string;
                  issuedAt: number;
                  commentBody: string;
                  debateTitle: string;
                }) => (
                  <li key={s.id} className="border border-[var(--border)] p-3 text-sm">
                    <p className="font-mono text-[9px] text-[var(--muted)]">
                      {s.issuedBy} ·{' '}
                      {formatDistanceToNow(new Date(s.issuedAt * 1000), { addSuffix: true })}
                    </p>
                    <p className="mt-1 text-[var(--text)]">{s.reason}</p>
                    <p className="mt-1 text-xs italic text-[var(--muted)]">
                      &ldquo;{truncate(s.commentBody, 120)}&rdquo; — {s.debateTitle}
                    </p>
                  </li>
                ),
              )}
            </ul>
            {data.userState.strikeCount > 0 && (
              <button
                type="button"
                onClick={() => pardonMutation.mutate()}
                disabled={pardonMutation.isPending}
                className="border border-[var(--border)] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--signal)] disabled:opacity-50"
              >
                Pardon (remove 1 strike)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function useFlaggedCount(enabled = true) {
  const { data } = useQuery({
    queryKey: ['editor-flagged-count'],
    queryFn: async () => {
      const res = await fetch('/api/editor/comments/flagged?limit=1');
      if (!res.ok) return 0;
      const json = await res.json();
      return json.flaggedCount as number;
    },
    enabled,
    refetchInterval: 30000,
  });
  return data ?? 0;
}
