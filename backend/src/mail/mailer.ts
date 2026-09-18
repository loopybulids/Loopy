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

/** Escape anything a person typed before it goes into HTML mail. */
function esc(v: string) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);
}

/**
 * The buyer's receipt, sent the moment an order is confirmed.
 *
 * Every figure the buyer was charged, in the order they were charged it, so
 * the total in the email can be checked against the total on the screen and
 * the one on their bank statement. The platform fee is itemised rather than
 * folded into the goods: they paid it, so hiding it would leave the lines not
 * adding up.
 *
 * Sent when the money is real — after the gateway confirms an online payment,
 * or at checkout for cash on delivery, where the label says plainly that
 * nothing has been charged yet.
 */
export function orderReceiptEmail(
  order: any,
  opts: { storeName?: string | null; storeContact?: string | null; ordersUrl?: string | null } = {},
) {
  const paymentId = String(order?.paymentId || '');
  const cod = paymentId === 'cod';
  // Only a confirmed payment carries the gateway's transaction id; a bare
  // `online:upi` is just the method the buyer picked.
  const confirmed = /^online:[^:]+:.+/.test(paymentId);
  const method = cod
    ? 'Cash on delivery'
    : confirmed
      ? `Paid online · ${(paymentId.split(':')[1] || 'UPI').toUpperCase()}`
      : 'Paid online';
  const reference = paymentId.split(':').slice(2).join(' · ');

  const items = order?.itemsAmount ?? 0;
  const discount = order?.discountAmount ?? 0;
  const shipping = order?.shippingCharge ?? 0;
  const fee = order?.commissionAmount ?? 0;
  const total = order?.totalAmount ?? 0;
  const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
  const store = opts.storeName || 'the store';

  const line = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:5px 0;font-size:13px;color:${strong ? '#0E2A47' : '#5B6B80'};font-weight:${strong ? 700 : 400}">${label}</td>
      <td style="padding:5px 0;font-size:${strong ? '15px' : '13px'};text-align:right;color:${strong ? '#15784A' : '#0E2A47'};font-weight:${strong ? 800 : 600}">${value}</td>
    </tr>`;

  const itemRows = (order?.items || [])
    .map((i: any) => `
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#0E2A47">${esc(i.title)} <span style="color:#8A98AD">× ${i.quantity}</span></td>
        <td style="padding:5px 0;font-size:13px;text-align:right;color:#0E2A47">${inr(i.unitPrice * i.quantity)}</td>
      </tr>`)
    .join('');

  const bill = `
    <div style="background:#F6F5F0;border-radius:12px;padding:14px 16px">
      <table style="width:100%;border-collapse:collapse">${itemRows}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;padding-top:8px;border-top:1px solid #E8E6DE">
        ${line('Items total', inr(items))}
        ${discount > 0 ? line(order?.couponCode ? `Discount · ${esc(order.couponCode)}` : 'Discount', `−${inr(discount)}`) : ''}
        ${line('Shipping', shipping ? inr(shipping) : 'Free')}
        ${fee > 0 ? line('Platform fee', inr(fee)) : ''}
        ${line(cod ? 'Amount due on delivery' : 'Total paid', inr(total), true)}
      </table>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #E8E6DE;font-size:12px;color:#5B6B80">
        <b style="color:#0E2A47">${method}</b>${reference ? ` · ${esc(reference)}` : ''}
      </div>
    </div>`;

  const where = order?.address
    ? `<div style="margin-top:14px;font-size:12px;color:#5B6B80">
         <div style="text-transform:uppercase;letter-spacing:.08em;font-size:10.5px;color:#8A98AD">Delivering to</div>
         <div style="margin-top:3px;color:#0E2A47">${esc(order.address)}</div>
       </div>`
    : '';

  const track = opts.ordersUrl
    ? `<div style="text-align:center;margin:18px 0 4px">
         <a href="${opts.ordersUrl}" style="display:inline-block;background:#15784A;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:11px 20px;border-radius:999px">Track this order</a>
       </div>`
    : '';

  const help = opts.storeContact
    ? `<p style="margin:14px 0 0;font-size:12px;color:#5B6B80">Questions about this order? Contact ${esc(store)} at
         <a href="mailto:${esc(opts.storeContact)}?subject=${encodeURIComponent(`Order #${ref(order)}`)}" style="color:#15784A">${esc(opts.storeContact)}</a>.</p>`
    : '';

  const plain = [
    `Order #${ref(order)} — ${store}`,
    '',
    ...(order?.items || []).map((i: any) => `${i.title} x ${i.quantity}  ${inr(i.unitPrice * i.quantity)}`),
    '',
    `Items total: ${inr(items)}`,
    ...(discount > 0 ? [`Discount${order?.couponCode ? ` (${order.couponCode})` : ''}: -${inr(discount)}`] : []),
    `Shipping: ${shipping ? inr(shipping) : 'Free'}`,
    ...(fee > 0 ? [`Platform fee: ${inr(fee)}`] : []),
    `${cod ? 'Amount due on delivery' : 'Total paid'}: ${inr(total)}`,
    `Payment: ${method}${reference ? ` (${reference})` : ''}`,
    ...(order?.address ? ['', `Delivering to: ${order.address}`] : []),
    ...(opts.ordersUrl ? ['', `Track it: ${opts.ordersUrl}`] : []),
  ].join('\n');

  return {
    subject: `${cod ? 'Order' : 'Receipt for order'} #${ref(order)} — ${inr(total)}${opts.storeName ? ` · ${opts.storeName}` : ''}`,
    text: plain,
    html: shell(
      cod ? 'Order confirmed 🎉' : 'Payment received 🎉',
      cod
        ? `Your order <b>#${ref(order)}</b> with ${esc(store)} is confirmed. Pay <b>${inr(total)}</b> in cash when it arrives.`
        : `Thank you — we have your payment of <b>${inr(total)}</b> for order <b>#${ref(order)}</b> with ${esc(store)}. This email is your receipt.`,
      bill + where + track + help,
    ),
  };
}

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
