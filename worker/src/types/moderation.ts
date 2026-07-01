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
export type ViolationSeverity = 'mild' | 'moderate' | 'extreme';
export type ViolationType =
  | 'warning'
  | 'timeout'
  | 'social_ban'
  | 'auto_delete'
  | 'flagged_review';

export interface CommentRow {
  id: string;
  debate_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: number;
  deleted_at: number | null;
  deleted_by: 'bot' | 'editor' | 'user' | null;
  moderation_status: CommentStatus;
}

export interface CommentFlagRow {
  id: string;
  comment_id: string;
  flagged_by: FlagActor;
  flag_type: FlagType;
  confidence: number | null;
  reasoning: string | null;
  resolved_by: string | null;
  resolved_action: ModerationAction | null;
  created_at: number;
  resolved_at: number | null;
}

export interface UserModerationStateRow {
  user_id: string;
  strike_count: number;
  comment_blocked: number;
  banned: number;
  warning_count: number;
  timeout_count: number;
  timeout_until: number | null;
  social_banned: number;
  updated_at: number;
}

export type ModerationResult = {
  action: 'allow' | 'auto_delete' | 'flag';
  severity: ViolationSeverity;
  flags: {
    type: Exclude<FlagType, 'false_positive'>;
    confidence: number;
    reasoning: string;
  }[];
  primaryReason?: string;
};

export interface ExtendedModerationState {
  strikeCount: number;
  commentBlocked: boolean;
  banned: boolean;
  warningCount: number;
  timeoutCount: number;
  timeoutUntil: number | null;
  socialBanned: boolean;
  canComment: boolean;
  canPostTopics: boolean;
  canVote: boolean;
}

export const WARNING_MESSAGE =
  'Your comment has been flagged for review. Please keep the conversation educational and avoid personal attacks or masked profanity.';

export const TIMEOUT_MESSAGE_PREFIX =
  'Your commenting privileges have been temporarily suspended until';
