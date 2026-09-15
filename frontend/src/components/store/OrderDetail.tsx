'use client';
import { rupees } from '@/lib/api';

/**
 * Full breakdown of a single order — items, who it's going to, where, how it
 * was paid and the money split.
 *
 * `commissionAmount` is shown as "Platform fee": the customer is charged it on
 * top of items + shipping, so hiding it would leave the lines not adding up to
 * the total they paid. What stays hidden is the settlement side — what the
 * seller receives is not the shopper's business.
 */

/** Statuses at which the goods are with the customer, so COD cash is in hand. */
const DELIVERED = ['Delivered', 'Completed'];

/**
 * Whether the money has actually been collected, and how to describe it.
 *
 * `Order.status` tracks fulfilment, not payment, and a COD order is created as
 * "Paid" so it enters the seller's queue — but no cash has changed hands until
 * it's delivered. Derived here rather than stored, so it can never drift out of
 * sync with the order's status.
 */
export function paymentState(order: any): { label: string; paid: boolean; short: string } {
  // Created, waiting on the gateway. Nothing has been collected, whatever the
  // payment method says — otherwise an unpaid online order read "Paid online".
  if (order?.status === 'PendingPayment') {
    return { label: 'Awaiting payment', paid: false, short: 'Unpaid' };
  }

  const p = String(order?.paymentId || '');
  const delivered = DELIVERED.includes(order?.status);

  if (p === 'cod') {
    return {
      label: 'Cash on Delivery',
      paid: delivered,
      short: 'COD',
    };
  }
  if (p.startsWith('online')) {
    const m = p.split(':')[1];
    const nice = m === 'upi' ? 'UPI' : m === 'card' ? 'Card' : m === 'netbanking' ? 'Netbanking' : '';
    return { label: `Paid online${nice ? ` · ${nice}` : ''}`, paid: true, short: 'Online' };
  }
  return { label: 'Prepaid', paid: true, short: 'Prepaid' };
}

export function paymentLabel(paymentId?: string | null) {
  return paymentState({ paymentId }).label;
}

export function orderRef(id: string) {
  return `#${String(id).slice(-6).toUpperCase()}`;
}

/**
 * Human label for `Order.status`.
 *
 * The stored value "Paid" means "placed and in the seller's queue" — it is set
 * for COD too, where no money has moved yet. Showing it verbatim made a COD
 * order the seller hadn't even accepted look already paid, so the fulfilment
 * stage is labelled here and the money is shown separately by `paymentState`.
 */
const STATUS_LABEL: Record<string, string> = {
  PendingPayment: 'Awaiting payment',
  Paid: 'New',
  Accepted: 'Accepted',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Completed: 'Completed',
  Cancelled: 'Rejected',
  Disputed: 'Disputed',
  Refunded: 'Refunded',
};

/**
 * `cancelledBy` distinguishes the two paths that both store status='Cancelled':
 * the buyer pulling out vs the seller declining.
 */
export function statusLabel(status?: string, cancelledBy?: string | null) {
  // 'system' is a payment that was never completed — the seller did not reject it.
  if (status === 'Cancelled') return cancelledBy === 'buyer' || cancelledBy === 'system' ? 'Cancelled' : 'Rejected';
  return STATUS_LABEL[String(status || '')] || status || '—';
}

/** Tailwind chip class for a status — neutral unless it needs attention. */
export function statusChip(status?: string) {
  if (status === 'Cancelled' || status === 'Disputed') return 'chip-rose';
  if (status === 'PendingPayment') return 'chip-amber';
  return 'chip-green';
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-bold text-navy' : 'font-semibold text-navy'}>{value}</span>
    </div>
  );
}

export default function OrderDetail({ order, showContact = true }: { order: any; showContact?: boolean }) {
  const items = order?.items || [];
  const itemsAmount = order?.itemsAmount ?? items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
  const shipping = order?.shippingCharge ?? 0;
  // Charged to the customer on top of net items + shipping (see backend common/money).
  const fee = order?.commissionAmount ?? 0;
  const discount = order?.discountAmount ?? 0;
  const when = order?.createdAt ? new Date(order.createdAt) : null;
  const contactName = order?.customer?.name || order?.buyerName;
  const contactPhone = order?.customer?.phone || order?.buyerPhone;
  const contactEmail = order?.customer?.email;
  const pay = paymentState(order);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-display text-[15px] font-bold text-navy">Order {orderRef(order.id)}</div>
          {when && (
            <div className="text-[12px] text-faint">
              {when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {when.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>
        {order?.status && <span className={statusChip(order.status)}>{statusLabel(order.status, order.cancelledBy)}</span>}
      </div>

      {/* items */}
      <div className="border-t border-line pt-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">Items</div>
        <div className="space-y-2">
          {items.map((it: any) => (
            <div key={it.id || it.title} className="flex justify-between gap-3 text-[13px]">
              <span className="min-w-0 flex-1">
                <span className="text-navy">{it.title}</span>
                <span className="text-faint"> × {it.quantity}</span>
                <span className="block text-[11.5px] text-faint">{rupees(it.unitPrice)} each</span>
              </span>
              <span className="whitespace-nowrap font-semibold text-navy">{rupees(it.unitPrice * it.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* shipment — appears for both sides the moment the seller ships */}
      {order?.awbNumber && (
        <div className="border-t border-line pt-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">Shipment</div>
          <div className="space-y-1 text-[13px]">
            {order?.courier && (
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="text-muted">Courier</span>
                <b className="text-navy">{order.courier}</b>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-muted">Tracking number</span>
              <b className="select-all font-mono text-navy">{order.awbNumber}</b>
            </div>
          </div>
          <p className="mt-1 text-[11.5px] text-faint">
            {DELIVERED.includes(order?.status) ? 'Delivered.' : 'On its way — use this number to track your parcel.'}
          </p>
        </div>
      )}

      {order?.status === 'Cancelled' && order?.cancelReason && (
        <div className="border-t border-line pt-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-faint">
            {order.cancelledBy === 'buyer' ? 'Cancellation reason' : 'Reason the seller gave'}
          </div>
          <p className="text-[13px] text-navy">{order.cancelReason}</p>
        </div>
      )}

      {/* who + where */}
      {showContact && (contactName || order?.address) && (
        <div className="border-t border-line pt-3">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">Delivering to</div>
          {contactName && <div className="text-[13px] font-semibold text-navy">{contactName}</div>}
          {(contactPhone || contactEmail) && (
            <div className="text-[12.5px] text-muted">{[contactPhone, contactEmail].filter(Boolean).join(' · ')}</div>
          )}
          {order?.address && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{order.address}</p>}
        </div>
      )}

      {/* money */}
      <div className="space-y-1.5 border-t border-line pt-3">
        <Row label="Items total" value={rupees(itemsAmount)} />
        {discount > 0 && (
          <Row label={order?.couponCode ? `Discount · ${order.couponCode}` : 'Discount'} value={`−${rupees(discount)}`} />
        )}
        <Row label="Shipping" value={shipping ? rupees(shipping) : 'Free'} />
        {fee > 0 && <Row label="Platform fee" value={rupees(fee)} />}
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px]">
          <span className="font-semibold text-navy">Total</span>
          <span className="font-display font-bold text-green-600">{rupees(order?.totalAmount ?? 0)}</span>
        </div>
        <div className="flex items-center justify-between pt-0.5 text-[13px]">
          <span className="text-muted">Payment</span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-navy">{pay.label}</span>
            <span className={pay.paid ? 'chip-green' : 'chip-amber'}>
              {pay.paid ? 'Paid' : order?.status === 'PendingPayment' ? 'Not paid' : 'Due on delivery'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
