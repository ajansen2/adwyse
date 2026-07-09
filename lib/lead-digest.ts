/**
 * Lead Digest — compiles scored leads into an email
 * and sends via Resend to Adam.
 */

import { Resend } from 'resend';
import { ScoredLead } from './lead-scorer';

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = 'adam@argora.ai';
const FROM_EMAIL = 'AdWyse <leads@send.adwyse.ca>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildLeadCard(lead: ScoredLead): string {
  const scoreColor =
    lead.score >= 8 ? '#22c55e' : lead.score >= 5 ? '#f59e0b' : '#6b7280';
  const scoreBg =
    lead.score >= 8 ? '#052e16' : lead.score >= 5 ? '#451a03' : '#1f2937';

  return `
    <div style="background: #1e1e2e; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="color: #94a3b8; font-size: 13px;">r/${escapeHtml(lead.post.subreddit)}</span>
        <span style="background: ${scoreBg}; color: ${scoreColor}; padding: 2px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">
          Score: ${lead.score}/10
        </span>
      </div>

      <a href="${escapeHtml(lead.post.url)}" style="color: #f97316; font-size: 16px; font-weight: 600; text-decoration: none; line-height: 1.4;">
        ${escapeHtml(lead.post.title || '(comment)')}
      </a>

      <p style="color: #cbd5e1; font-size: 13px; margin: 10px 0 6px 0;">
        ${escapeHtml(lead.reason)}
      </p>

      ${
        lead.post.body
          ? `<div style="background: #0f172a; border-left: 3px solid #334155; padding: 10px 14px; margin: 12px 0; border-radius: 4px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; white-space: pre-wrap; max-height: 120px; overflow: hidden;">
                ${escapeHtml(lead.post.body.slice(0, 500))}${lead.post.body.length > 500 ? '...' : ''}
              </p>
            </div>`
          : ''
      }

      ${
        lead.draftReply
          ? `<div style="margin-top: 14px;">
              <p style="color: #f59e0b; font-size: 12px; font-weight: 600; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Draft Reply
              </p>
              <div style="background: #1a1a2e; border: 1px solid #f59e0b33; padding: 12px 14px; border-radius: 8px;">
                <p style="color: #e2e8f0; font-size: 13px; margin: 0; white-space: pre-wrap; line-height: 1.5;">
                  ${escapeHtml(lead.draftReply)}
                </p>
              </div>
            </div>`
          : ''
      }
    </div>`;
}

function buildDigestHtml(leads: ScoredLead[], allCount: number): string {
  const date = formatDate();
  const actionable = leads.filter((l) => l.score >= 5);
  const lowScore = leads.filter((l) => l.score < 5 && l.score > 0);

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8" /></head>
  <body style="margin: 0; padding: 0; background: #0f0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 640px; margin: 0 auto; padding: 32px 20px;">

      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #f97316; font-size: 24px; margin: 0;">AdWyse Lead Scanner</h1>
        <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">${date}</p>
      </div>

      <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <div style="display: inline-block; margin: 0 20px;">
          <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: uppercase;">Total Found</p>
          <p style="color: #fff; font-size: 28px; font-weight: 700; margin: 4px 0 0 0;">${allCount}</p>
        </div>
        <div style="display: inline-block; margin: 0 20px;">
          <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: uppercase;">Actionable</p>
          <p style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 4px 0 0 0;">${actionable.length}</p>
        </div>
      </div>

      ${
        actionable.length > 0
          ? `<h2 style="color: #fff; font-size: 18px; margin: 24px 0 12px 0;">Actionable Leads (score >= 5)</h2>
             ${actionable.map(buildLeadCard).join('')}`
          : `<div style="background: #1e1e2e; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 16px;">
              <p style="color: #94a3b8; font-size: 15px; margin: 0;">No high-score leads today. The scanner is running — just a quiet day on Reddit.</p>
            </div>`
      }

      ${
        lowScore.length > 0
          ? `<h2 style="color: #64748b; font-size: 15px; margin: 24px 0 12px 0;">Low-Score (skipped)</h2>
             <div style="background: #1e1e2e; border-radius: 12px; padding: 16px;">
               ${lowScore
                 .map(
                   (l) =>
                     `<div style="padding: 8px 0; border-bottom: 1px solid #333;">
                       <a href="${escapeHtml(l.post.url)}" style="color: #64748b; font-size: 13px; text-decoration: none;">
                         [${l.score}] ${escapeHtml(l.post.title || '(comment)').slice(0, 80)}
                       </a>
                       <span style="color: #475569; font-size: 12px; margin-left: 8px;">${escapeHtml(l.skipReason || l.reason)}</span>
                     </div>`
                 )
                 .join('')}
             </div>`
          : ''
      }

      <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #333;">
        <p style="color: #475569; font-size: 12px; margin: 0;">
          AdWyse Lead Scanner &middot; Runs daily at noon UTC
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

function buildNoLeadsHtml(): string {
  const date = formatDate();
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8" /></head>
  <body style="margin: 0; padding: 0; background: #0f0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 640px; margin: 0 auto; padding: 32px 20px; text-align: center;">
      <h1 style="color: #f97316; font-size: 24px; margin: 0;">AdWyse Lead Scanner</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 24px 0;">${date}</p>
      <div style="background: #1e1e2e; border-radius: 12px; padding: 32px;">
        <p style="color: #94a3b8; font-size: 15px; margin: 0;">
          No leads found today. Reddit was quiet — the scanner ran successfully.
        </p>
      </div>
      <p style="color: #475569; font-size: 12px; margin-top: 32px;">
        AdWyse Lead Scanner &middot; Runs daily at noon UTC
      </p>
    </div>
  </body>
  </html>`;
}

/**
 * Send the lead digest email via Resend.
 */
export async function sendLeadDigest(
  leads: ScoredLead[]
): Promise<{ success: boolean; error?: string }> {
  const actionable = leads.filter((l) => l.score >= 5);
  const date = new Date().toISOString().split('T')[0];

  const subject =
    leads.length === 0
      ? `AdWyse Lead Scanner — No leads found (${date})`
      : `AdWyse Lead Scanner — ${actionable.length} lead${actionable.length !== 1 ? 's' : ''} found (${date})`;

  const html =
    leads.length === 0
      ? buildNoLeadsHtml()
      : buildDigestHtml(leads, leads.length);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html,
    });

    if (error) {
      console.error('[lead-digest] Resend error:', error);
      return { success: false, error: String(error.message) };
    }

    console.log(`[lead-digest] Sent digest: ${subject}`);
    return { success: true };
  } catch (err) {
    console.error('[lead-digest] Failed to send:', err);
    return { success: false, error: String(err) };
  }
}
