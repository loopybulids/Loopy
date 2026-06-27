'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Chip, Icon, money, SectionTitle, statusChip } from '@/components/admin/AdminKit';

export default function OrderInvestigation() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api.adminOrderDetail(id).then(setD).catch((e) => setErr(e?.message || 'Not found'));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (action: string) => {
    if (!confirm(`Confirm: ${action} this order?`)) return;
    setBusy(action);
    try { await api.adminOrderAction(id, action); await load(); } catch (e: any) { alert(e?.message || 'Failed'); }
    setBusy('');
  };

  if (err) return <Card className="p-6 text-rose">{err} — <Link href="/admin/orders" className="underline">back to orders</Link></Card>;
  if (!d) return <div className="animate-pulse"><div className="h-8 w-48 rounded bg-line" /></div>;

  const riskTone = d.risk > 50 ? 'rose' : d.risk > 20 ? 'amber' : 'green';

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-navy"><Icon name="back" size={15} /> Orders</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[26px] font-extrabold text-navy">Order #{d.id.slice(-6).toUpperCase()}</h1>
            {statusChip(d.status)}
          </div>
          <p className="text-[13px] text-muted">Placed {new Date(d.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={riskTone as any}>Risk {d.risk}/100</Chip>
          <Chip tone={d.fraudScore === 'High' ? 'rose' : d.fraudScore === 'Medium' ? 'amber' : 'green'}>Fraud: {d.fraudScore}</Chip>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* timeline */}
          <Card className="p-5">
            <SectionTitle>Order Timeline</SectionTitle>
            <ol className="relative ml-2 space-y-4 border-l-2 border-line pl-5">
              {d.timeline.map((t: any) => (
                <li key={t.key} className="relative">
                  <span className={`absolute -left-[1.65rem] top-0.5 grid h-5 w-5 place-items-center rounded-full text-white ${t.done ? 'bg-green-600' : 'bg-line'}`}><Icon name="check" size={12} /></span>
                  <div className="flex items-center justify-between">
                    <span className={`text-[13.5px] font-bold ${t.done ? 'text-navy' : 'text-faint'}`}>{t.label}</span>
                    {t.at && <span className="text-[11px] text-muted">{new Date(t.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  {t.note && <div className="text-[11px] text-muted">{t.note}</div>}
                </li>
              ))}
            </ol>
          </Card>

          {/* items */}
          <Card className="p-5">
            <SectionTitle>Items ({d.items.length})</SectionTitle>
            <div className="space-y-3">
              {d.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">{it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-faint"><Icon name="box" size={18} /></span>}</span>
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold text-navy">{it.title}</div><div className="text-[11px] text-muted">{[it.brand, it.category, it.condition].filter(Boolean).join(' · ')}</div></div>
                  <div className="text-right text-[13px]"><div className="font-bold text-navy">{money(it.price)}</div><div className="text-[11px] text-muted">×{it.qty}</div></div>
                </div>
              ))}
            </div>
          </Card>

          {/* payment + settlement */}
          <Card className="p-5">
            <SectionTitle>Payment & Settlement</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px] sm:grid-cols-3">
              <Field label="Method" value={d.payment.method} />
              <Field label="Payment ID" value={d.payment.id || '—'} />
              <Field label="Gateway Ref" value={d.payment.razorpay || '—'} />
              <Field label="Items Total" value={money(d.amounts.items)} />
              <Field label="Shipping" value={money(d.amounts.shipping)} />
              <Field label="Commission" value={money(d.amounts.commission)} accent />
              <Field label="GST (est. 18%)" value={money(d.amounts.gst)} />
              <Field label="Order Total" value={money(d.amounts.total)} bold />
            </div>
          </Card>

          {d.dispute && (
            <Card className="p-5">
              <SectionTitle action={statusChip(d.dispute.status)}>Dispute</SectionTitle>
              <div className="text-[13px] text-navy"><b>{d.dispute.issueType}</b> — {d.dispute.description || 'No description'}</div>
            </Card>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* actions */}
          <Card className="p-5">
            <SectionTitle>One-Click Actions</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Action label="Mark Shipped" onClick={() => act('ship')} busy={busy === 'ship'} />
              <Action label="Mark Delivered" onClick={() => act('deliver')} busy={busy === 'deliver'} />
              <Action label="Refund" tone="rose" onClick={() => act('refund')} busy={busy === 'refund'} />
              <Action label="Cancel Order" tone="rose" onClick={() => act('cancel')} busy={busy === 'cancel'} />
              <Action label="Contact Seller" onClick={() => d.seller.email && (window.location.href = `mailto:${d.seller.email}`)} />
              <Action label="Contact Customer" onClick={() => d.customer.phone && (window.location.href = `tel:${d.customer.phone}`)} />
            </div>
          </Card>

          {/* customer */}
          <Card className="p-5">
            <SectionTitle>Customer</SectionTitle>
            <div className="space-y-2 text-[13px]">
              <Field label="Name" value={d.customer.name} />
              <Field label="Phone" value={d.customer.phone || '—'} />
              <Field label="Address" value={d.customer.address || '—'} />
              <Field label="Total Orders" value={d.customer.orders} />
              <Field label="Lifetime Value" value={money(d.customer.ltv)} accent />
            </div>
          </Card>

          {/* seller */}
          <Card className="p-5">
            <SectionTitle action={<Link href={`/admin/sellers/${d.seller.id}`} className="text-[12px] font-semibold text-green-600">Open →</Link>}>Seller</SectionTitle>
            <div className="space-y-2 text-[13px]">
              <Field label="Store" value={d.seller.storeName} />
              <Field label="Email" value={d.seller.email || '—'} />
              <Field label="City" value={d.seller.city || '—'} />
              <Field label="Rating" value={`${(d.seller.rating || 0).toFixed(1)} ★`} />
              <div className="flex items-center justify-between"><span className="text-faint">KYC</span>{statusChip(d.seller.kyc)}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, bold, accent }: { label: string; value: any; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-faint">{label}</span>
      <span className={`truncate text-right ${bold ? 'font-extrabold text-navy' : accent ? 'font-bold text-green-600' : 'font-semibold text-navy'}`}>{value}</span>
    </div>
  );
}

function Action({ label, onClick, tone, busy }: { label: string; onClick: () => void; tone?: 'rose'; busy?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy} className={`rounded-xl px-3 py-2.5 text-[12.5px] font-bold disabled:opacity-50 ${tone === 'rose' ? 'bg-rose-soft text-rose hover:bg-rose/10' : 'bg-paper text-navy hover:bg-line/60'}`}>
      {busy ? '…' : label}
    </button>
  );
}
