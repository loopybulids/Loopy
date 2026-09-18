'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

/**
 * Get in touch, above the footer.
 *
 * The details on the left are the ones the policies commit to — the support
 * address, the Instagram account, where the team is, and the 48-hour
 * acknowledgement from the complaints Article. No opening hours, because
 * nothing in the policies promises any.
 *
 * The form posts to the API, which emails support. If that email cannot be
 * sent the panel says so and shows the address, rather than thanking someone
 * for a message that went nowhere.
 */

const SUPPORT_EMAIL = 'loopynowshopsupport@gmail.com';
const INSTAGRAM = 'loopynow';

const BLANK = { name: '', email: '', subject: '', message: '' };

function Detail({ icon, label, value, sub, href }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-soft text-green-600">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.09em] text-faint">{label}</span>
        <span className="block break-words text-[14px] font-semibold text-navy">{value}</span>
        {sub && <span className="block text-[12px] text-muted">{sub}</span>}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        className="flex items-start gap-3 transition-opacity hover:opacity-80"
      >
        {body}
      </a>
    );
  }
  return <div className="flex items-start gap-3">{body}</div>;
}

const Ico = ({ d, circle }: { d: string; circle?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {circle && <circle cx="12" cy="12" r="9" />}
    <path d={d} />
  </svg>
);

export default function ContactSection() {
  const [f, setF] = useState(BLANK);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    // Mirrors the server's own rules, so an obvious gap is caught here rather
    // than coming back as a validation error.
    if (!f.name.trim() || !f.email.trim() || !f.subject.trim()) return setErr('Please fill in your name, email and a subject.');
    if (f.message.trim().length < 10) return setErr('Please tell us a little more — at least a sentence.');

    setBusy(true);
    setErr('');
    try {
      const r = await api.contact({
        name: f.name.trim(),
        email: f.email.trim(),
        subject: f.subject.trim(),
        message: f.message.trim(),
      });
      // `sent` means we have the message: it is recorded before any email is
      // attempted, so a mail problem is ours to chase, not the visitor's.
      if (r?.sent) {
        setDone(true);
        setF(BLANK);
      } else {
        setErr(`We couldn’t take that just now — please email us at ${r?.supportEmail || SUPPORT_EMAIL}.`);
      }
    } catch (e: any) {
      setErr(e?.message || `Something went wrong — please email us at ${SUPPORT_EMAIL}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16 sm:px-8 sm:pb-24">
      <div className="grid gap-10 rounded-[28px] border border-line bg-white p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-green-600">Contact us</div>
          <h2 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-0.025em] text-navy sm:text-[36px]">
            Get in touch
          </h2>
          <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
            Questions about an order, selling on Loopy, or something that has gone wrong — write to us and we’ll
            acknowledge it within 48 hours.
          </p>

          <div className="mt-7 space-y-5">
            <Detail
              icon={<Ico d="M3 7.5 12 13l9-5.5M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V7a1.5 1.5 0 0 1 1.5-1.5Z" />}
              label="Email"
              value={SUPPORT_EMAIL}
              href={`mailto:${SUPPORT_EMAIL}`}
            />
            <Detail
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="3.9" />
                  <circle cx="17.3" cy="6.7" r="1.15" fill="currentColor" stroke="none" />
                </svg>
              }
              label="Instagram"
              value={`@${INSTAGRAM}`}
              sub="DM us for a quick reply"
              href={`https://www.instagram.com/${INSTAGRAM}`}
            />
            <Detail
              icon={<Ico circle d="M12 7.5V12l3 2" />}
              label="Response time"
              value="Within 48 hours"
              sub="Complaints are resolved within a month, per our policies"
            />
            <Detail
              icon={<Ico d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Zm0-8.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" />}
              label="Where we are"
              value="Mumbai, Maharashtra"
              sub="India"
            />
          </div>
        </div>

        {done ? (
          <div className="grid place-items-center rounded-3xl border border-green/25 bg-green-soft/40 p-8 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="m5 12 5 5L20 6" />
                </svg>
              </span>
              <h3 className="mt-4 font-display text-[20px] font-bold text-navy">Message sent</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                Thanks for writing in — we’ll get back to you within 48 hours at the email you gave us.
              </p>
              <button onClick={() => setDone(false)} className="btn-ghost mt-5">Send another</button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-line bg-paper/60 p-5 sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12.5px] font-bold text-navy">Your name</span>
                <input value={f.name} onChange={(e) => { set('name', e.target.value); setErr(''); }} placeholder="Zohan Alam" className="c-input mt-1.5" />
              </label>
              <label className="block">
                <span className="text-[12.5px] font-bold text-navy">Email address</span>
                <input type="email" value={f.email} onChange={(e) => { set('email', e.target.value); setErr(''); }} placeholder="you@example.com" className="c-input mt-1.5" />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-[12.5px] font-bold text-navy">Subject</span>
              <input value={f.subject} onChange={(e) => { set('subject', e.target.value); setErr(''); }} placeholder="How can we help?" className="c-input mt-1.5" />
            </label>

            <label className="mt-4 block">
              <span className="text-[12.5px] font-bold text-navy">Message</span>
              <textarea
                rows={5}
                maxLength={2000}
                value={f.message}
                onChange={(e) => { set('message', e.target.value); setErr(''); }}
                placeholder="Tell us a bit more — an order number helps if it’s about an order."
                className="c-input mt-1.5"
              />
            </label>

            {err && <p className="mt-3 text-[13px] font-semibold text-rose">{err}</p>}

            <button onClick={send} disabled={busy} className="btn-green mt-5 w-full justify-center disabled:opacity-60">
              {busy ? 'Sending…' : 'Send message'}
              {!busy && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
            <p className="mt-2.5 text-center text-[11.5px] text-faint">
              We only use your email to reply to this message.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
