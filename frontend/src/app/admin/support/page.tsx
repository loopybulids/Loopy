'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Chip, money, SectionTitle, StatCard, statusChip } from '@/components/admin/AdminKit';

export default function SupportCenter() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const [loading, setLoading] = useState(true);

  // Messages people sent us: the website's contact form, and sellers
  // reporting problems with the platform.
  const [inbox, setInbox] = useState<any[]>([]);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [deciding, setDeciding] = useState('');

  const load = () => api.adminDisputes().then((d) => { setDisputes(d); setLoading(false); }).catch(() => setLoading(false));
  const loadInbox = () => api.adminSupportInbox().then((r) => setInbox(r?.items || [])).catch(() => setInbox([]));
  useEffect(() => { load(); loadInbox(); }, []);

  const decide = async (id: string, action: 'resolve' | 'reopen') => {
    setDeciding(id);
    try { await api.adminSupportDecide(id, action); await loadInbox(); }
    catch { /* the list reloads on the next visit either way */ }
    finally { setDeciding(''); }
  };

  const messages = inboxOpen ? inbox.filter((m) => !m.resolved) : inbox;
  const openMessages = inbox.filter((m) => !m.resolved).length;

  const resolve = async (id: string, r: 'refunded' | 'released') => { await api.resolveDispute(id, r); load(); };

  const shown = tab === 'open' ? disputes.filter((d) => d.status === 'open') : disputes;
  const open = disputes.filter((d) => d.status === 'open').length;
  const priority = (d: any) => (d.issueType?.toLowerCase().includes('not') ? 'High' : 'Normal');

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-[26px] font-bold text-slate">Support & Dispute Center</h1><p className="text-[14px] text-dim">Resolve customer disputes and release or refund payments.</p></div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Tickets" value={open} icon="headset" accent={open ? 'amber' : 'green'} />
        <StatCard label="Total Tickets" value={disputes.length} icon="bell" accent="navy" />
        <StatCard label="Refunded" value={disputes.filter((d) => d.status === 'refunded').length} icon="refund" accent="rose" />
        <StatCard label="Released" value={disputes.filter((d) => d.status === 'released').length} icon="check" accent="green" />
      </div>

      {/* Messages first: a dispute has an order and a queue behind it, while a
          message has nobody but whoever reads this page. */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair px-5 py-3.5">
          <SectionTitle>
            Messages {openMessages > 0 && <span className="ml-1 font-num text-[12px] text-alert">{openMessages} open</span>}
          </SectionTitle>
          <div className="inline-flex rounded-lg bg-cool p-0.5">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                onClick={() => setInboxOpen(v)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-bold ${inboxOpen === v ? 'bg-white text-slate shadow-sm' : 'text-dim'}`}
              >
                {v ? 'Open' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {!messages.length ? (
          <div className="px-5 py-10 text-center text-[13px] text-dim">
            {inboxOpen ? 'No open messages.' : 'Nothing has come in yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-hair">
            {messages.map((m) => (
              <li key={m.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={m.kind === 'seller' ? 'violet' : 'navy'}>{m.kind === 'seller' ? 'Seller' : 'Website'}</Chip>
                  {m.topic && <Chip tone="gray">{m.topic}</Chip>}
                  {m.resolved ? <Chip tone="green">Resolved</Chip> : <Chip tone="amber">Open</Chip>}
                  <span className="ml-auto font-num text-[11.5px] text-pale">
                    {new Date(m.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mt-2 text-[13.5px] font-bold text-slate">{m.subject}</div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-dim">{m.message}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
                  <span className="font-semibold text-slate">{m.from}</span>
                  {m.email && (
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                      className="font-semibold text-accent hover:underline"
                    >
                      {m.email}
                    </a>
                  )}
                  {m.sellerId && (
                    <Link href={`/admin/sellers/${m.sellerId}`} className="font-semibold text-accent hover:underline">
                      Open store →
                    </Link>
                  )}
                  <button
                    onClick={() => decide(m.id, m.resolved ? 'reopen' : 'resolve')}
                    disabled={deciding === m.id}
                    className={`ml-auto rounded-lg px-3 py-1.5 text-[12px] font-bold disabled:opacity-50 ${
                      m.resolved ? 'bg-cool text-dim hover:text-slate' : 'bg-accent text-white hover:bg-accent-600'
                    }`}
                  >
                    {deciding === m.id ? '…' : m.resolved ? 'Reopen' : 'Mark resolved'}
                  </button>
                  {m.resolved && m.decidedBy && (
                    <span className="text-[11px] text-pale">by {m.decidedBy}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="inline-flex rounded-xl bg-white p-1 shadow-card">
        {(['open', 'all'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-[13px] font-bold capitalize ${tab === t ? 'bg-slate text-white' : 'text-dim'}`}>{t === 'open' ? `Open (${open})` : 'All'}</button>)}
      </div>

      <div className="space-y-3">
        {loading && <Card className="p-6 text-center text-dim animate-pulse">Loading tickets…</Card>}
        {!loading && !shown.length && <Card className="p-8 text-center text-dim">No {tab === 'open' ? 'open ' : ''}tickets. 🎉</Card>}
        {shown.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-dim">TKT-{d.id.slice(-6).toUpperCase()}</span>
                <Chip tone={priority(d) === 'High' ? 'rose' : 'gray'}>{priority(d)} priority</Chip>
                {statusChip(d.status)}
              </div>
              <Link href={`/admin/orders/${d.orderId}`} className="text-[12px] font-bold text-accent hover:underline">Order #{d.orderId.slice(-6).toUpperCase()} →</Link>
            </div>
            <div className="mt-2 text-[14px] font-bold text-slate">{d.issueType}</div>
            <p className="mt-0.5 text-[13px] text-dim">{d.description || 'No description provided.'}</p>
            <div className="mt-1 text-[12px] text-pale">Raised by {d.buyerName || 'customer'} · {new Date(d.createdAt).toLocaleString('en-IN')}</div>
            {d.status === 'open' && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => resolve(d.id, 'released')} className="rounded-xl bg-cool px-4 py-2 text-[12.5px] font-bold text-slate hover:bg-hair/60">Release to seller</button>
                <button onClick={() => resolve(d.id, 'refunded')} className="rounded-xl bg-alert-soft px-4 py-2 text-[12.5px] font-bold text-alert">Refund customer</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
