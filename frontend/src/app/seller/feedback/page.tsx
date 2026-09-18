'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHead, Panel, Empty } from '@/components/seller-ui';
import { Bolt, Check } from '@/components/icons';

/**
 * Tell Loopy something is wrong.
 *
 * Sellers hit platform problems that no order screen can express — a payout
 * that looks wrong, a page that will not load, a feature they need. This puts
 * that in front of an operator with the store attached, so nobody has to ask
 * who is reporting it, and shows the seller whether it has been dealt with
 * rather than leaving them wondering whether it was received at all.
 */

const TOPICS = ['Bug', 'Payments', 'Orders', 'Store or products', 'Feature request', 'Something else'];
const BLANK = { topic: 'Bug', subject: '', message: '' };

export default function Feedback() {
  const [f, setF] = useState(BLANK);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const load = () =>
    api.myReports()
      .then((r) => setMine(r || []))
      .catch(() => setMine([]))
      .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!f.subject.trim()) return setErr('Give it a short subject.');
    if (f.message.trim().length < 10) return setErr('Please describe the problem in a sentence or two.');

    setBusy(true);
    setErr('');
    try {
      await api.sellerReport({ topic: f.topic, subject: f.subject.trim(), message: f.message.trim() });
      setF(BLANK);
      setSent(true);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Could not send that — please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead title="Help & feedback" sub="Report a bug or a problem with Loopy — it goes straight to our team." />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel title="Report an issue">
          {sent && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-green/30 bg-green-soft/50 px-3.5 py-3">
              <span className="mt-0.5 text-green-600"><Check size={15} /></span>
              <div>
                <div className="text-[13px] font-bold text-navy">Thanks — we have it</div>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">
                  Our team has been notified. You can see it below, and this page will show when it has been dealt with.
                </p>
              </div>
            </div>
          )}

          <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">What is it about?</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { set('topic', t); setErr(''); }}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                  f.topic === t ? 'bg-green-soft text-green' : 'bg-paper text-muted hover:text-navy'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">Subject</label>
          <input
            value={f.subject}
            onChange={(e) => { set('subject', e.target.value); setErr(''); setSent(false); }}
            placeholder="Payout shows the wrong amount"
            className="c-input mt-1.5"
          />

          <label className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-faint">What happened?</label>
          <textarea
            rows={6}
            maxLength={2000}
            value={f.message}
            onChange={(e) => { set('message', e.target.value); setErr(''); setSent(false); }}
            placeholder="What you did, what you expected, and what happened instead. Order numbers help."
            className="c-input mt-1.5"
          />

          {err && <p className="mt-2.5 text-[13px] font-semibold text-rose">{err}</p>}

          <button onClick={submit} disabled={busy} className="btn-green mt-4 w-full justify-center disabled:opacity-60">
            {busy ? 'Sending…' : <><Bolt size={15} /> Send to Loopy</>}
          </button>
        </Panel>

        <Panel title="Your reports">
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-line/60" />)}
            </div>
          ) : !mine.length ? (
            <Empty
              icon={<Bolt size={24} />}
              title="Nothing reported yet"
              hint="Anything you send us shows up here, along with whether it has been dealt with."
            />
          ) : (
            <div className="divide-y divide-line">
              {mine.map((m) => (
                <div key={m.id} className="py-3.5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={m.resolved ? 'chip-green' : 'chip-amber'}>{m.resolved ? 'Resolved' : 'Open'}</span>
                    {m.topic && <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-semibold text-muted">{m.topic}</span>}
                    <span className="ml-auto font-num text-[11.5px] text-faint">
                      {new Date(m.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[13.5px] font-bold text-navy">{m.subject}</div>
                  <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
