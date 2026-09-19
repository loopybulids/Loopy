/**
 * The single source of truth for order money.
 *
 * Every rupee shown anywhere — checkout, order detail, seller wallet, admin
 * dashboard, finance, payouts — must come from here. Before this existed the
 * codebase held competing formulas: checkout charged `items + shipping`, the
 * admin displayed a commission and GST line that were not in that total, and
 * seller payouts summed `itemsAmount` while GMV summed `totalAmount`. Nothing
 * reconciled.
 *
 * The approved model (LoopyNow Admin PRD):
 *
 *   net goods          = items - discount
 *   customer pays      = net goods + shipping + platform fee
 *   seller receives    = net goods + shipping
 *   Loopy keeps        = platform fee   (see platformFee below)
 *
 * which always satisfies:  customerTotal === sellerReceivable + fee
 *
 * A seller's coupon is the seller's own promotion, so the discount comes out
 * of their share alone. The fee is charged on the list price and is
 * deliberately unaffected by the discount — running a promotion does not
 * reduce what Loopy charges, so the rate is predictable for both sides
 * regardless of promotions.
 */

export const COMMISSION_PCT = Number(process.env.COMMISSION_PERCENT || 5);

/** Goods value below which the fee is a flat amount rather than a percentage. */
export const FEE_FLAT_BELOW = Number(process.env.COMMISSION_FLAT_BELOW || 100);
/** The flat fee on those small orders. */
export const FEE_FLAT = Number(process.env.COMMISSION_FLAT || 5);

/**
 * Loopy's fee on a goods value, at list price.
 *
 * A percentage alone does not pay for a small order: the payment, the support
 * and the bookkeeping cost the same whatever the ticket, so below
 * FEE_FLAT_BELOW the fee is a flat FEE_FLAT instead. The two meet exactly at
 * the boundary with the default numbers (5% of 100 is 5), so there is no step
 * where the rules change — move either constant and that stops being true.
 *
 * One function, because the buyer's checkout total, the seller's receivable
 * and the platform's revenue all have to agree about it.
 */
export function platformFee(itemsAmount: number, pct = COMMISSION_PCT): number {
  const items = Math.round(itemsAmount);
  return items < FEE_FLAT_BELOW ? Math.round(FEE_FLAT) : Math.round((items * pct) / 100);
}

export interface OrderAmounts {
  /** Goods value at list price, before any discount, shipping or fee. */
  items: number;
  /** Coupon discount off the goods value. Borne by the seller. */
  discount: number;
  /** Goods value actually sold for: items - discount. The fee is charged on this. */
  netItems: number;
  /** Delivery charge — collected from the customer, paid through to the seller. */
  shipping: number;
  /** Loopy's platform fee, charged on the goods value. */
  fee: number;
  /** What the customer is charged. Stored as `Order.totalAmount`. */
  customerTotal: number;
  /** What the seller is owed once delivery is verified. */
  sellerReceivable: number;
}

/** Round to whole rupees — amounts are stored as integers. */
const r = (n: number) => Math.round(n);

/**
 * Compute every figure for an order from its goods value, shipping and any
 * coupon discount.
 *
 * The discount is clamped to the goods value: a coupon worth more than the
 * cart cannot make the goods negative and turn shipping into a payout.
 */
export function computeAmounts(
  itemsAmount: number,
  shippingCharge: number,
  discountAmount = 0,
  pct = COMMISSION_PCT,
): OrderAmounts {
  const items = r(itemsAmount);
  const shipping = r(shippingCharge);
  const discount = Math.min(Math.max(r(discountAmount), 0), items);
  const netItems = items - discount;
  // Charged on `items`, the list price — not on `netItems`. A seller's coupon
  // is their promotion to fund; it does not discount Loopy's fee.
  const fee = platformFee(items, pct);
  return {
    items,
    discount,
    netItems,
    shipping,
    fee,
    customerTotal: netItems + shipping + fee,
    sellerReceivable: netItems + shipping,
  };
}

/**
 * Re-derive the amounts for an order already in the database.
 *
 * Reads the stored columns rather than recomputing the fee, so historical
 * orders keep the fee they were actually charged even if the rate changes.
 */
export function amountsOf(order: {
  itemsAmount: number; shippingCharge: number; commissionAmount: number; totalAmount: number;
  discountAmount?: number | null;
}): OrderAmounts & { reconciles: boolean; difference: number } {
  const items = order.itemsAmount || 0;
  const discount = order.discountAmount || 0;
  const netItems = items - discount;
  const shipping = order.shippingCharge || 0;
  const fee = order.commissionAmount || 0;
  const sellerReceivable = netItems + shipping;
  const expected = sellerReceivable + fee;
  return {
    items, discount, netItems, shipping, fee,
    customerTotal: order.totalAmount || 0,
    sellerReceivable,
    // A stored total that disagrees with its parts is a ledger fault, not a
    // display bug — surfaced so the admin can see it rather than hiding it.
    reconciles: expected === (order.totalAmount || 0),
    difference: (order.totalAmount || 0) - expected,
  };
}

/** What the seller is owed across a set of orders, net of coupon discounts. */
export function sellerReceivableOf(
  orders: { itemsAmount: number; shippingCharge: number; discountAmount?: number | null }[],
) {
  return orders.reduce(
    (s, o) => s + (o.itemsAmount || 0) - (o.discountAmount || 0) + (o.shippingCharge || 0),
    0,
  );
}

/** Total coupon discount given away across a set of orders. */
export function discountOf(orders: { discountAmount?: number | null }[]) {
  return orders.reduce((s, o) => s + (o.discountAmount || 0), 0);
}

/** Platform revenue across a set of orders. */
export function platformFeeOf(orders: { commissionAmount: number }[]) {
  return orders.reduce((s, o) => s + (o.commissionAmount || 0), 0);
}

/** Gross merchandise value — what customers were charged. */
export function gmvOf(orders: { totalAmount: number }[]) {
  return orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
}

/**
 * Reconciliation across a set of orders: GMV must equal seller liability plus
 * platform fees. Any difference is reported rather than silently absorbed.
 */
export function reconcile(orders: { itemsAmount: number; shippingCharge: number; commissionAmount: number; totalAmount: number; discountAmount?: number | null }[]) {
  const gmv = gmvOf(orders);
  const sellerLiability = sellerReceivableOf(orders);
  const platformFee = platformFeeOf(orders);
  const difference = gmv - (sellerLiability + platformFee);
  const offenders = orders.filter((o) => !amountsOf(o).reconciles).length;
  return {
    gmv,
    sellerLiability,
    platformFee,
    difference,
    reconciled: difference === 0,
    unreconciledOrders: offenders,
    formula: 'GMV = seller receivable (items - discount + shipping) + platform fee',
  };
}
