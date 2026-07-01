import { generateId } from './moderationHelpers';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  discussion_id: string | null;
  read_at: number | null;
  created_at: number;
}

const TYPE_ICONS: Record<string, string> = {
  moderation: '⚠️',
  topic: '📋',
  reply: '💬',
  comments: '🔔',
  update: '⚡',
};

export function notificationIcon(type: string): string {
  return TYPE_ICONS[type] ?? '🔔';
}

export async function createNotification(
  db: D1Database,
  userId: string,
  data: {
    type: string;
    title: string;
    body: string;
    discussionId?: string | null;
  },
): Promise<string> {
  if (!userId?.trim()) return '';
  const id = await generateId('ntf');
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, type, title, body, discussion_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, data.type, data.title, data.body, data.discussionId ?? null)
    .run();
  return id;
}

export function rowToNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    read: row.read_at != null,
    title: row.title,
    body: row.body,
    discussionId: row.discussion_id ?? undefined,
    at: row.created_at * 1000,
    icon: notificationIcon(row.type),
  };
}
