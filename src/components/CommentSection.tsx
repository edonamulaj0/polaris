import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useMemo, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useUserStore } from '../stores/userStore';
import type { Comment, UserModerationState } from '../types/moderation';
import { MODERATION_DISCLAIMER, WARNING_MESSAGE } from '../types/moderation';

function relativeTime(ts: number) {
  return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true });
}

function formatTimeoutCountdown(timeoutUntil: number): string {
  const ms = timeoutUntil * 1000 - Date.now();
  if (ms <= 0) return 'Suspension expired — refresh to continue.';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const until = new Date(timeoutUntil * 1000).toLocaleString();
  return `Your commenting privileges have been temporarily suspended until ${until} (${hours}h ${mins}m remaining) due to a violation of our community guidelines.`;
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`Empty response (${res.status})`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      res.ok
        ? 'Invalid response from server'
        : text.slice(0, 160) || `Request failed (${res.status})`,
    );
  }
}

async function fetchComments(debateId: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/debates/${encodeURIComponent(debateId)}/comments?limit=50`, {
    headers,
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(String(data.message || data.error || 'Failed to load comments'));
  }
  return data as { comments: Comment[]; nextCursor: string | null };
}

async function fetchModerationState(token: string) {
  const res = await fetch('/api/users/me/moderation-state', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await parseJsonResponse(res);
  return data as UserModerationState;
}

function CommentAuthPrompt() {
  const setGoogleProfileFromJwt = useUserStore((s) => s.setGoogleProfileFromJwt);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="mb-6 text-sm text-[var(--muted)]">
        Sign-in is not configured. Set <code className="text-[var(--text)]">VITE_GOOGLE_CLIENT_ID</code>{' '}
        to comment.
      </p>
    );
  }

  return (
    <div className="mb-8 rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-5 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--signal)]">
        Sign in to comment
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">
        Your session expired or you need to sign in with Google before joining the debate.
      </p>
      <div className="mt-4 flex justify-start">
        <GoogleLogin
          onSuccess={(res) => {
            const credential = res.credential;
            if (!credential) return;
            try {
              setGoogleProfileFromJwt(jwtDecode(credential), credential);
            } catch {
              /* invalid jwt */
            }
          }}
          onError={() => {}}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
      </div>
    </div>
  );
}

function ModerationNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-4 border border-amber-500/50 bg-amber-500/10 px-4 py-3"
    >
      <p className="text-sm text-[var(--text)]">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--text)]"
      >
        Dismiss
      </button>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  currentUserId: string;
  onReply?: () => void;
  isReply?: boolean;
}) {
  const removed = comment.removed || comment.pendingReview || comment.body.startsWith('[');

  return (
    <div className={`${isReply ? 'ml-6 border-l border-[var(--border)] pl-4' : ''}`}>
      <div className="py-3">
        {removed ? (
          <p className={`text-sm italic ${comment.pendingReview ? 'text-amber-400/90' : 'text-[var(--muted)]'}`}>
            {comment.body}
          </p>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-hi)]">
                {comment.username}
              </span>
              <span className="font-mono text-[9px] text-[var(--muted)]">
                {relativeTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text)]">{comment.body}</p>
            {!isReply && onReply && currentUserId && (
              <button
                type="button"
                onClick={onReply}
                className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--signal)]"
              >
                Reply
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReplyInput({
  debateId,
  parentId,
  token,
  onDone,
  onCancel,
  onModerationNotice,
}: {
  debateId: string;
  parentId: string;
  token: string;
  onDone: () => void;
  onCancel: () => void;
  onModerationNotice: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/debates/${encodeURIComponent(debateId)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: text, parentId }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(String(data.message || data.error || 'Failed to post'));
      return data;
    },
    onSuccess: (data) => {
      if (data.message) onModerationNotice(data.message);
      queryClient.invalidateQueries({ queryKey: ['comments', debateId] });
      queryClient.invalidateQueries({ queryKey: ['moderation-state'] });
      onDone();
    },
  });

  return (
    <div className="ml-6 border-l border-[var(--border)] pl-4 pb-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = body.trim();
            if (text.length >= 2 && !mutation.isPending) mutation.mutate(text);
          }
        }}
        rows={2}
        placeholder="Write a reply…"
        className="w-full resize-y rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)]"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={body.trim().length < 2 || mutation.isPending}
          onClick={() => mutation.mutate(body.trim())}
          className="bg-[var(--signal)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--signal-on)] disabled:opacity-50"
        >
          {mutation.isPending ? 'Posting…' : 'Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-[var(--border)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--muted)]"
        >
          Cancel
        </button>
      </div>
      {mutation.isError && (
        <p className="mt-1 font-mono text-[9px] text-[var(--signal)]">
          {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  debateId,
  currentUserId,
  token,
  onModerationNotice,
}: {
  comment: Comment;
  replies: Comment[];
  debateId: string;
  currentUserId: string;
  token: string;
  onModerationNotice: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const replyCount = comment.replyCount ?? replies.length;

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        onReply={token ? () => setReplying(true) : undefined}
      />
      {replyCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[var(--signal)] hover:underline"
        >
          {expanded ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
      {expanded &&
        replies.map((r) => (
          <CommentItem key={r.id} comment={r} currentUserId={currentUserId} isReply />
        ))}
      {replying && (
        <ReplyInput
          debateId={debateId}
          parentId={comment.id}
          token={token}
          onDone={() => setReplying(false)}
          onCancel={() => setReplying(false)}
          onModerationNotice={onModerationNotice}
        />
      )}
    </div>
  );
}

function CommentInput({
  debateId,
  debateTitle,
  debateCategory,
  token,
  modState,
  onModerationNotice,
}: {
  debateId: string;
  debateTitle?: string;
  debateCategory?: string;
  token: string;
  modState: UserModerationState | null;
  onModerationNotice: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const recordComment = useUserStore((s) => s.recordComment);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/debates/${encodeURIComponent(debateId)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: text }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(String(data.message || data.error || 'Failed to post'));
      return data;
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['comments', debateId] });
      const prev = queryClient.getQueryData<{ comments: Comment[] }>(['comments', debateId]);
      const googleSub = useUserStore.getState().googleSub;
      const name = useUserStore.getState().name;
      const optimistic: Comment = {
        id: `opt-${Date.now()}`,
        userId: googleSub,
        username: name || 'You',
        parentId: null,
        body: text,
        createdAt: Math.floor(Date.now() / 1000),
        replyCount: 0,
      };
      if (prev) {
        queryClient.setQueryData(['comments', debateId], {
          ...prev,
          comments: [optimistic, ...prev.comments],
        });
      }
      setBody('');
      return { prev };
    },
    onSuccess: (data, text) => {
      if (data.status === 'flagged' || data.status === 'removed') {
        queryClient.invalidateQueries({ queryKey: ['comments', debateId] });
      }
      if (data.message) onModerationNotice(data.message);
      recordComment({
        discussionId: debateId,
        title: debateTitle || 'Discussion',
        category: debateCategory,
        body: text,
      });
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['comments', debateId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', debateId] });
      queryClient.invalidateQueries({ queryKey: ['moderation-state'] });
    },
  });

  const socialBanned = modState?.socialBanned || modState?.banned;

  if (socialBanned) {
    return (
      <div className="border border-[var(--signal)]/40 bg-[var(--surface-hi)] px-4 py-3">
        <p className="text-sm text-[var(--muted)]">
          Your account has been permanently banned from participating in this platform. You can
          still read news and articles, but cannot comment, vote, or create topics.
        </p>
      </div>
    );
  }

  const blocked = modState?.commentBlocked || modState?.canComment === false;
  const timeoutUntil = modState?.timeoutUntil;

  return (
    <div className="space-y-3">
      <label className="font-mono text-[10px] uppercase tracking-[.15em] text-[var(--text-hi)]">
        Your comment
      </label>
      {blocked && timeoutUntil && (
        <div className="border border-[var(--signal)]/40 bg-[var(--surface-hi)] px-4 py-3">
          <p className="text-sm text-[var(--muted)]">{formatTimeoutCountdown(timeoutUntil)}</p>
        </div>
      )}
      {blocked && !timeoutUntil && (
        <div className="border border-[var(--signal)]/40 bg-[var(--surface-hi)] px-4 py-3">
          <p className="text-sm text-[var(--muted)]">
            Your commenting is suspended. You have {modState?.strikeCount ?? 0} strikes.
          </p>
        </div>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = body.trim();
            if (!blocked && text.length >= 2 && !mutation.isPending) mutation.mutate(text);
          }
        }}
        disabled={blocked || mutation.isPending}
        rows={3}
        placeholder="Add to the debate — be specific, be civil. Enter to post, Shift+Enter for new line."
        className="w-full resize-y rounded-none border border-[var(--border)] bg-[var(--surface-hi)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--signal)] disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-[var(--muted)]">{body.length}/2000</span>
        <button
          type="button"
          disabled={blocked || body.trim().length < 2 || mutation.isPending}
          onClick={() => mutation.mutate(body.trim())}
          className="signal-glow-hover bg-[var(--signal)] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--signal-on)] disabled:opacity-50"
        >
          {mutation.isPending ? 'Posting…' : 'Post comment'}
        </button>
      </div>
      {mutation.isError && (
        <p className="font-mono text-[9px] text-[var(--signal)]">
          {(mutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

export function CommentSection({
  debateId,
  debateTitle,
  debateCategory,
}: {
  debateId: string;
  debateTitle?: string;
  debateCategory?: string;
}) {
  const googleSub = useUserStore((s) => s.googleSub);
  const googleIdToken = useUserStore((s) => s.googleIdToken);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', debateId, googleIdToken ?? 'anon'],
    queryFn: () => fetchComments(debateId, googleIdToken || undefined),
    refetchInterval: 30000,
  });

  const { data: modState } = useQuery({
    queryKey: ['moderation-state'],
    queryFn: () => fetchModerationState(googleIdToken!),
    enabled: Boolean(googleSub && googleIdToken),
    refetchInterval: 60000,
  });

  const { topLevel, repliesByParent } = useMemo(() => {
    const comments = data?.comments ?? [];
    const top = comments.filter((c) => !c.parentId);
    const byParent: Record<string, Comment[]> = {};
    for (const c of comments) {
      if (c.parentId) {
        if (!byParent[c.parentId]) byParent[c.parentId] = [];
        byParent[c.parentId].push(c);
      }
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [data]);

  return (
    <section className="mt-10 border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[var(--signal)]">
        Join the debate
      </h2>

      <div
        role="note"
        className="mb-6 border border-[var(--signal)]/30 bg-[var(--signal)]/5 px-4 py-3"
      >
        <p className="text-sm leading-relaxed text-[var(--text)]">{MODERATION_DISCLAIMER}</p>
      </div>

      {notice && (
        <ModerationNotice message={notice} onDismiss={() => setNotice(null)} />
      )}

      {!googleSub ? (
        <CommentAuthPrompt />
      ) : !googleIdToken ? (
        <CommentAuthPrompt />
      ) : (
        <div className="mb-8">
          <CommentInput
            debateId={debateId}
            debateTitle={debateTitle}
            debateCategory={debateCategory}
            token={googleIdToken}
            modState={modState ?? null}
            onModerationNotice={setNotice}
          />
        </div>
      )}

      {isLoading && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
          Loading comments…
        </p>
      )}
      {error && (
        <p className="mb-4 font-body text-xs text-[var(--amber-glow)]">
          Could not load comments{(error as Error)?.message ? `: ${(error as Error).message}` : ''}. You can still post above — try refreshing if this persists.
        </p>
      )}

      <div>
        {topLevel.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            replies={repliesByParent[comment.id] ?? []}
            debateId={debateId}
            currentUserId={googleSub}
            token={googleIdToken}
            onModerationNotice={setNotice}
          />
        ))}
        {!isLoading && topLevel.length === 0 && (
          <p className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            No comments yet — start the conversation.
          </p>
        )}
      </div>
    </section>
  );
}

export { WARNING_MESSAGE };
