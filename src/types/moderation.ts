export type CommentStatus = 'visible' | 'auto_deleted' | 'flagged' | 'editor_deleted' | 'cleared';
export type FlagType =
  | 'offensive'
  | 'sarcasm'
  | 'irony'
  | 'borderline'
  | 'false_positive'
  | 'masking_bypass';
export type FlagActor = 'bot' | 'editor';
export type StrikeActor = 'bot' | 'editor';
export type ModerationAction = 'delete' | 'clear' | 'false_positive' | 'approve';

export interface Comment {
  id: string;
  debateId?: string;
  userId: string | null;
  username: string | null;
  parentId: string | null;
  body: string;
  createdAt: number;
  deletedAt?: number | null;
  deletedBy?: 'bot' | 'editor' | 'user' | null;
  moderationStatus?: CommentStatus;
  replyCount?: number;
  removed?: boolean;
  removedByBot?: boolean;
  pendingReview?: boolean;
}

export interface CommentFlag {
  id: string;
  commentId?: string;
  flaggedBy: FlagActor;
  flagType?: FlagType;
  type?: FlagType;
  label?: string;
  confidence: number;
  reasoning: string;
  resolvedBy?: string | null;
  resolvedAction?: ModerationAction | null;
  createdAt: number;
  resolvedAt?: number | null;
}

export interface UserModerationState {
  userId: string;
  strikeCount: number;
  commentBlocked: boolean;
  banned: boolean;
  socialBanned?: boolean;
  warningCount?: number;
  timeoutCount?: number;
  timeoutUntil?: number | null;
  canComment?: boolean;
  canPostTopics?: boolean;
  canVote?: boolean;
}

export interface FlaggedCommentItem {
  comment: Comment & { debateTitle: string; debateId: string };
  flags: CommentFlag[];
  userState: UserModerationState;
}

export interface ModerationViolation {
  id: string;
  type: string;
  triggerReason: string;
  severity: string | null;
  penaltyApplied: string | null;
  createdAt: number;
  commentBody: string | null;
  debateTitle: string | null;
}

export const MODERATION_DISCLAIMER =
  'Comments are automatically monitored. Offensive, inappropriate, or harmful content will be auto-deleted to maintain an educational environment and prevent personal attacks.';

export const WARNING_MESSAGE =
  'Your comment has been flagged for review. Please keep the conversation educational and avoid personal attacks or masked profanity.';
