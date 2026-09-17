import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Gmail SMTP sender.
 *
 * SMTP_PASS must be a Google **App Password** (16 characters, generated at
 * myaccount.google.com/apppasswords with 2-Step Verification on) — a normal
 * account password is rejected by Gmail's SMTP.
 *
 * When SMTP isn't configured we don't fail the request: the caller falls back to
 * returning the code in the API response so local dev works with no mail set up.
 */

const log = new Logger('Mailer');

let transport: nodemailer.Transporter | null = null;

export function mailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function get(): nodemailer.Transporter | null {
  if (!mailConfigured()) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replace(/\s+/g, '') },
    });
  }
  return transport;
}

/** Returns true if the mail actually went out. Never throws. */
export async function sendMail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  const t = get();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || `Loopy <${process.env.SMTP_USER}>`,
      to, subject, html, text,
    });
    return true;
  } catch (e: any) {
    // A mail outage shouldn't take the signup endpoint down with it.
    log.error(`Could not send "${subject}" to ${to}: ${e?.message || e}`);
    return false;
  }
}

const shell = (title: string, intro: string, body: string) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 6px;font-size:20px;color:#0E2A47">${title}</h2>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#5B6B80">${intro}</p>
    ${body}
    <p style="margin:22px 0 0;font-size:12px;color:#8A98AD">Sent by Loopy on behalf of the store.</p>
  </div>`;

const summary = (order: any) => {
  const rows = (order.items || [])
    .map((i: any) => `<tr><td style="padding:4px 0;font-size:13px;color:#0E2A47">${i.title} × ${i.quantity}</td>
      <td style="padding:4px 0;font-size:13px;text-align:right;color:#0E2A47">₹${(i.unitPrice * i.quantity).toLocaleString('en-IN')}</td></tr>`)
    .join('');
  return `<div style="background:#F6F5F0;border-radius:12px;padding:14px 16px">
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #E8E6DE;display:flex;justify-content:space-between">
        <span style="font-size:13px;font-weight:700;color:#0E2A47">Total</span>
        <span style="font-size:15px;font-weight:800;color:#15784A">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</span>
      </div>
    </div>`;
};

const ref = (order: any) => String(order?.id || '').slice(-6).toUpperCase();

/** Seller accepted — the order is confirmed and will be fulfilled. */
export function orderAcceptedEmail(order: any, storeName?: string) {
  const who = storeName ? ` by ${storeName}` : '';
  return {
    subject: `Order #${ref(order)} confirmed${storeName ? ` — ${storeName}` : ''}`,
    text: `Good news — your order #${ref(order)} has been accepted${who} and is being prepared. Total ₹${(order.totalAmount || 0).toLocaleString('en-IN')}.`,
    html: shell(
      'Your order is confirmed 🎉',
      `Order <b>#${ref(order)}</b> has been accepted${who} and is being prepared. We'll let you know when it ships.`,
      summary(order),
    ),
  };
}

/** Seller shipped — carries the courier and tracking number. */
export function orderShippedEmail(order: any, storeName?: string) {
  const who = storeName ? ` from ${storeName}` : '';
  const courier = order?.courier || 'Courier';
  const awb = order?.awbNumber || '';
  return {
    subject: `Order #${ref(order)} has shipped${storeName ? ` — ${storeName}` : ''}`,
    text: `Your order #${ref(order)}${who} is on its way. Courier: ${courier}. Tracking number: ${awb}.`,
    html: shell(
      'Your order is on its way 📦',
      `Order <b>#${ref(order)}</b>${who} has been dispatched.`,
      `<div style="background:#F6F5F0;border-radius:12px;padding:14px 16px;margin-bottom:14px">
         <div style="font-size:13px;color:#5B6B80">Courier</div>
         <div style="font-size:15px;font-weight:700;color:#0E2A47;margin-bottom:10px">${courier}</div>
         <div style="font-size:13px;color:#5B6B80">Tracking number</div>
         <div style="font-size:17px;font-weight:800;letter-spacing:1px;color:#15784A;font-family:monospace">${awb}</div>
       </div>` + summary(order),
    ),
  };
}

/**
 * Asks the buyer to rate an order that has just been delivered.
 *
 * Sent once, the moment a seller marks the order Delivered — the point at
 * which the buyer has the goods in hand and an opinion worth capturing. The
 * link goes straight to the order in their account, where the star form is.
 */
export function reviewRequestEmail(order: any, storeName?: string, reviewUrl?: string) {
  const who = storeName ? ` from ${storeName}` : '';
  const stars = reviewUrl
    ? `<div style="text-align:center;margin:4px 0 18px">
         <a href="${reviewUrl}" style="font-size:30px;letter-spacing:6px;text-decoration:none;color:#E8B10A">★★★★★</a>
       </div>`
    : '';

  return {
    subject: `How was your order${storeName ? ` from ${storeName}` : ''}?`,
    text: `Your order #${ref(order)}${who} has been delivered. Tell others what you thought — rate it out of 5 and leave a comment${reviewUrl ? `: ${reviewUrl}` : ' in your account'}.`,
    html: shell(
      'How did we do? ⭐',
      `Your order <b>#${ref(order)}</b>${who} has arrived. A quick rating helps other shoppers — and helps the seller.`,
      stars + summary(order) +
      (reviewUrl
        ? `<div style="text-align:center;margin-top:18px">
             <a href="${reviewUrl}" style="display:inline-block;background:#15784A;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px">Rate this order</a>
           </div>`
        : ''),
    ),
  };
}

/** Seller declined — nothing is owed, and any stock has been released. */
export function orderRejectedEmail(order: any, storeName?: string, reason?: string) {
  const who = storeName ? ` by ${storeName}` : '';
  return {
    subject: `Order #${ref(order)} could not be accepted`,
    text: `Sorry — your order #${ref(order)} was declined${who}.${reason ? ` Reason: ${reason}` : ''} You have not been charged.`,
    html: shell(
      'Your order could not be accepted',
      `Unfortunately order <b>#${ref(order)}</b> was declined${who}.${reason ? ` <br><br><b>Reason:</b> ${reason}` : ''}
       <br><br>You have not been charged, and any reserved stock has been released.`,
      summary(order),
    ),
  };
}

/** Escape anything a person typed before it goes into HTML mail. */
function esc(v: string) {
  return String(v).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);
}

/**
 * A buyer asking the store to cancel an order.
 *
 * Their address is quoted in the body rather than used as the From header:
 * mail sent as the buyer would fail this domain's SPF and land in spam, so the
 * seller replies to the address written here instead.
 *
 * The message is escaped — it is typed by a member of the public and goes
 * straight into an HTML email.
 */
export function cancelRequestEmail(
  order: any,
  storeName: string | undefined,
  from: { name?: string | null; email?: string | null },
  message: string,
) {
  const who = from.name || 'A customer';
  const reply = from.email
    ? `<a href="mailto:${esc(from.email)}?subject=${encodeURIComponent(`Order #${ref(order)}`)}">${esc(from.email)}</a>`
    : 'them';

  return {
    subject: `Cancellation requested — order #${ref(order)}`,
    text:
      `${who} has asked to cancel order #${ref(order)}.\n\n"${message}"\n\n` +
      `Reply to ${from.email || 'the customer'} to sort it out. ` +
      `If you agree, reject the order in your Loopy console so the money goes back.`,
    html: shell(
      `${esc(who)} wants to cancel order #${ref(order)}`,
      `<b>Their message</b><br><i>${esc(message).replace(/\n/g, '<br>')}</i>
       <br><br>Reply to ${reply} to sort it out. If you agree, reject the order in your Loopy console so the
       money goes back to them.`,
      summary(order),
    ),
  };
}

export function verificationEmail(code: string, storeName?: string) {
  const who = storeName ? ` for ${storeName}` : '';
  return {
    subject: `${code} is your Loopy verification code`,
    text: `Your verification code${who} is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:440px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 4px;font-size:20px;color:#0E2A47">Confirm your email</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#5B6B80">
          Enter this code to finish creating your account${who}.
        </p>
        <div style="font-size:32px;font-weight:800;letter-spacing:10px;color:#0E2A47;
                    background:#F6F5F0;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="margin:20px 0 0;font-size:12.5px;color:#8A98AD">
          This code expires in 10 minutes. If you didn't request it, you can ignore this email.
        </p>
      </div>`,
  };
}
