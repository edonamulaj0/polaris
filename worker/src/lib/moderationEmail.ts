import type { Env } from '../types';

const BAN_SUBJECT = 'Account restricted — Polaris community guidelines';

const BAN_TEXT = `Your account has been permanently banned from participating in this platform for repeated or severe violations of our anti-harassment policy.

You can still read news, articles, and public content across the platform, but you may no longer post comments, create topics, vote, or share.

If you believe this was a mistake, contact our moderation team to appeal.`;

export async function sendSocialBanEmail(
  env: Env,
  toEmail: string,
  userName: string,
): Promise<void> {
  const fromAddress = env.EMAIL_FROM?.trim();
  if (!fromAddress || !env.EMAIL) return;

  try {
    await env.EMAIL.send({
      to: toEmail,
      from: { email: fromAddress, name: 'Polaris Moderation' },
      subject: BAN_SUBJECT,
      text: `Hello ${userName},\n\n${BAN_TEXT}`,
      html: `<p>Hello ${userName},</p><p>${BAN_TEXT.replace(/\n\n/g, '</p><p>')}</p>`,
    });
  } catch {
    // Email is best-effort; ban still applies if send fails
  }
}
