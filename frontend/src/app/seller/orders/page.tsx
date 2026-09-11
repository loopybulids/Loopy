'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApiData } from '@/lib/use-api-data';
import { PageHead, Panel, Empty, money } from '@/components/seller-ui';
import OrderDetail, { paymentState, statusLabel, statusChip } from '@/components/store/OrderDetail';
import { Bag, Share, Plus } from '@/components/icons';

/**
 * Buyer cancellations and seller rejections both store status='Cancelled', so
 * they're split here by `cancelledBy` rather than by status alone.
 */
const FILTERS: { key: string; label: string; match: (o: any) => boolean }[] = [
  { key: 'All', label: 'All', match: () => true },
  { key: 'Paid', label: 'New', match: (o) => o.status === 'Paid' },
  { key: 'Accepted', label: 'Accepted', match: (o) => o.status === 'Accepted' },
  { key: 'Shipped', label: 'Shipped', match: (o) => o.status === 'Shipped' },
  { key: 'Delivered', label: 'Delivered', match: (o) => o.status === 'Delivered' },
  { key: 'Completed', label: 'Completed', match: (o) => o.status === 'Completed' },
  { key: 'Cancelled', label: 'Cancelled', match: (o) => o.status === 'Cancelled' && o.cancelledBy === 'buyer' },
  { key: 'Rejected', label: 'Rejected', match: (o) => o.status === 'Cancelled' && o.cancelledBy !== 'buyer' },
];

export default function Orders() {
  // Painted from the last visit on the first frame, then refreshed. Mirrored
  // into local state so accept/ship/reject can update a row optimistically.
  const { data: fetched, loading } = useApiData<any[]>('seller:orders', () => api.myOrders());
  const [orders, setOrders] = useState<any[]>(fetched ?? []);
  useEffect(() => { if (fetched) setOrders(fetched); }, [fetched]);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [actErr, setActErr] = useState('');

  // Move an order along the fulfilment chain and swap the updated row in place,
  // so the queue reflects the new status without a full refetch.
  const act = async (
    order: any,
    to: 'Accepted' | 'Shipped' | 'Delivered' | 'Rejected' | 'Reverted',
    extra?: string,
    // Shipping carries two values: the agency in `extra`, and the seller's own
    // tracking number here when they have one.
    awb?: string,
  ) => {
    setActErr('');
    setActing(order.id);
    try {
      const updated =
        to === 'Accepted' ? await api.acceptOrder(order.id)
        : to === 'Shipped' ? await api.shipOrder(order.id, extra || '', awb)
        : to === 'Delivered' ? await api.deliverOrder(order.id)
        : to === 'Reverted' ? await api.revertOrder(order.id)
        : await api.rejectOrder(order.id, extra);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    } catch (e: any) {
      setActErr(e?.message || 'Could not update this order.');
    } finally {
      setActing(null);
    }
  };


  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const shown = orders.filter(active.match);

  return (
    <div>
      <PageHead title="Orders" sub="Every order in one queue." action={<Link href="/seller/orders/new" className="btn-green"><Plus size={15} /> New order</Link>} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.key === 'All' ? orders.length : orders.filter(f.match).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                filter === f.key ? 'bg-green text-white' : 'bg-white text-muted ring-1 ring-line hover:text-navy'
              }`}
            >
              {f.label}
              {n > 0 && <span className={`ml-1.5 text-[11px] ${filter === f.key ? 'text-white/70' : 'text-faint'}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      <Panel>
        {loading ? (
          <p className="py-8 text-center text-[13px] text-faint">Loading…</p>
        ) : shown.length === 0 ? (
          <Empty
            icon={<Share size={24} />}
            title={orders.length === 0 ? 'No orders yet' : `No ${active.label.toLowerCase()} orders`}
            hint="Share a checkout link in a chat and paid orders will appear here automatically."
            action={<Link href="/seller/links" className="btn-green"><Plus size={15} /> Create a checkout link</Link>}
          />
        ) : (
          <div className="divide-y divide-line">
            {shown.map((o) => {
              const pay = paymentState(o);
              const open = expanded === o.id;
              return (
                <div key={o.id}>
                  <button
                    onClick={() => setExpanded(open ? null : o.id)}
                    className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-paper/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-soft text-green-600"><Bag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[14px] font-bold text-navy">#{String(o.id).slice(-6).toUpperCase()}</div>
                      <div className="truncate text-[12px] text-faint">
                        {o.customer?.name || o.buyerName || o.buyer?.name || 'Customer'}{o.buyerPhone || o.customer?.phone ? ` · ${o.buyerPhone || o.customer.phone}` : ''} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <span
                      title={pay.paid ? `${pay.label} — collected` : `${pay.label} — not collected yet`}
                      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${pay.paid ? 'bg-green-soft text-green-600' : 'bg-amber-soft text-amber'}`}
                    >
                      {pay.short}{pay.paid ? '' : ' · due'}
                    </span>
                    <span className="text-[14px] font-bold text-navy">{money(o.totalAmount ?? o.total ?? o.amount ?? 0)}</span>
                    <span className={`${statusChip(o.status)} ml-1`}>{statusLabel(o.status, o.cancelledBy)}</span>
                    <span className={`ml-1 shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {open && (
                    <div className="mb-3 rounded-xl border border-line bg-paper/50 p-4">
                      <OrderDetail order={o} />
                      <OrderActions order={o} busy={acting === o.id} onAct={act} err={acting === o.id ? actErr : ''} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

/**
 * Fulfilment controls. Only the single legal next step is offered, so the seller
 * can't skip Accepted → Shipped or move an order backwards.
 */
/** Where "Undo" sends each status. Mirrors revertStatus() on the server. */
const BACK_LABEL: Record<string, string> = {
  Accepted: 'New',
  Shipped: 'Accepted',
  Delivered: 'Shipped',
  Completed: 'Delivered',
};

const NEXT: Record<string, { to: 'Accepted' | 'Shipped' | 'Delivered'; label: string; hint: string }> = {
  Paid: { to: 'Accepted', label: 'Accept order', hint: 'Confirm you have this item and will fulfil it.' },
  Accepted: { to: 'Shipped', label: 'Mark as shipped', hint: 'Add the courier and tracking number.' },
  Shipped: { to: 'Delivered', label: 'Mark as delivered', hint: 'Buyer confirms to release your payout.' },
};

function OrderActions({ order, busy, onAct, err }: {
  order: any; busy: boolean; err: string;
  onAct: (o: any, to: 'Accepted' | 'Shipped' | 'Delivered' | 'Rejected' | 'Reverted', reason?: string, awb?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [shipping, setShipping] = useState(false);
  const [courier, setCourier] = useState('');
  const [awb, setAwb] = useState('');
  const step = NEXT[order.status];
  const canRevert = !!BACK_LABEL[order.status];
  const pay = paymentState(order);
  // On a COD order, "delivered" is also the moment the cash is collected.
  const codOnDelivery = step?.to === 'Delivered' && !pay.paid && pay.short === 'COD';
  // Once it's shipped, declining isn't a rejection any more — it's a refund.
  const canReject = ['Paid', 'PendingPayment', 'Accepted'].includes(order.status);

  // Tracking number is rendered by OrderDetail just above, for both sides.
  return (
    <div className="mt-4 border-t border-line pt-4">
      {step ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => (step.to === 'Shipped' ? setShipping((v) => !v) : onAct(order, step.to))}
              disabled={busy}
              className="btn-green px-4 py-2.5 text-[13px] disabled:opacity-60"
            >
              {busy ? 'Updating…' : step.label}
            </button>
            {canReject && (
              <button
                onClick={() => setRejecting((r) => !r)}
                disabled={busy}
                className="rounded-lg border border-rose/30 px-4 py-2.5 text-[13px] font-bold text-rose transition-colors hover:bg-rose-soft disabled:opacity-60"
              >
                Reject order
              </button>
            )}
            <span className="text-[12px] text-muted">
              {codOnDelivery
                ? `Marks the ${money(order.totalAmount ?? 0)} cash as collected.`
                : step.hint}
            </span>
          </div>

          {shipping && step.to === 'Shipped' && (
            <div className="mt-3 rounded-xl border border-green/30 bg-green-soft/30 p-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">
                    Shipping agency <span className="text-rose">*</span>
                  </label>
                  <input
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. Delhivery, Blue Dart, India Post"
                    maxLength={60}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && courier.trim() && onAct(order, 'Shipped', courier.trim(), awb.trim())}
                    className="c-input mt-1.5 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-faint">
                    Tracking number
                  </label>
                  <input
                    value={awb}
                    onChange={(e) => setAwb(e.target.value.toUpperCase())}
                    placeholder="From your courier's receipt"
                    maxLength={40}
                    onKeyDown={(e) => e.key === 'Enter' && courier.trim() && onAct(order, 'Shipped', courier.trim(), awb.trim())}
                    className="c-input mt-1.5 font-mono text-[13px] uppercase"
                  />
                </div>
              </div>

              <p className="mt-2 text-[11.5px] text-muted">
                {awb.trim()
                  ? 'The buyer will be emailed this courier and tracking number.'
                  : 'Leave the tracking number blank and a placeholder is generated — you can add the real one later by reverting and re-shipping. Sending emails the buyer either way.'}
              </p>

              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => onAct(order, 'Shipped', courier.trim(), awb.trim())}
                  disabled={busy || !courier.trim()}
                  className="btn-green px-4 py-2 text-[13px] disabled:opacity-50"
                >
                  {busy ? 'Sending…' : 'Send'}
                </button>
                <button onClick={() => { setShipping(false); setCourier(''); setAwb(''); }} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted hover:text-navy">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {rejecting && (
            <div className="mt-3 rounded-xl border border-rose/30 bg-rose-soft/40 p-3.5">
              <p className="text-[12.5px] font-semibold text-navy">
                Reject this order? Stock goes back to your catalogue and the customer is emailed.
              </p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional) — shown to the customer"
                className="c-input mt-2.5 text-[13px]"
              />
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => { setRejecting(false); onAct(order, 'Rejected', reason.trim() || undefined); }}
                  disabled={busy}
                  className="rounded-lg bg-rose px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? 'Rejecting…' : 'Confirm rejection'}
                </button>
                <button onClick={() => setRejecting(false)} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted hover:text-navy">
                  Keep order
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-[12.5px] font-semibold text-muted">
          {order.status === 'Delivered' ? 'Delivered.'
            : order.status === 'Completed' ? 'Completed. Payout released.'
            : order.status === 'Cancelled' ? 'This order was cancelled.'
            : `No further action while this order is ${order.status}.`}
        </p>
      )}
      {/* Undo — for a stage advanced by mistake. Cancelled orders are excluded:
          un-cancelling would need to re-reserve stock that may since have sold. */}
      {canRevert && (
        <button
          onClick={() => onAct(order, 'Reverted')}
          disabled={busy}
          className="mt-3 text-[12.5px] font-semibold text-muted transition-colors hover:text-navy disabled:opacity-60"
        >
          ↩ Undo — move back to {BACK_LABEL[order.status]}
        </button>
      )}

      {err && <p className="mt-2 text-[13px] font-semibold text-rose">{err}</p>}
    </div>
  );
}
