'use client';

/**
 * Google Analytics, for the parts of Loopy that shoppers see.
 *
 * Everything here is a no-op unless NEXT_PUBLIC_GA_ID is set, so localhost and
 * preview deployments never send anything and never need a second property to
 * keep test traffic out of the real numbers.
 *
 * Nothing sent from here identifies a person: page paths, order totals and
 * product names. No email, phone or address goes into an event — those belong
 * to the seller and to us, not to an analytics vendor.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

/** The seller console and the admin are ours, not the shop. */
export const isConsolePath = (path: string) => path.startsWith('/admin') || path.startsWith('/seller');

type Gtag = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === 'undefined') return null;
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  // Absent when analytics is switched off — or blocked by the visitor, which
  // is their call and not an error.
  return typeof g === 'function' ? g : null;
}

export function track(event: string, params: Record<string, unknown> = {}) {
  gtag()?.('event', event, params);
}

export function trackPageView(path: string) {
  if (isConsolePath(path)) return;
  gtag()?.('event', 'page_view', {
    page_path: path,
    page_location: typeof window === 'undefined' ? undefined : window.location.href,
    page_title: typeof document === 'undefined' ? undefined : document.title,
  });
}

/**
 * A completed order.
 *
 * Fired once per order id, guarded through sessionStorage: the confirmation
 * screen is reached both by finishing checkout and by returning from the
 * payment page, and a re-render or a refresh must not book the sale twice.
 */
export function trackPurchase(order: any) {
  if (!order?.id || !gtag()) return;

  const key = `loopy_ga_purchase_${order.id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Private window or storage blocked — send it and accept a possible repeat
    // rather than losing the event entirely.
  }

  track('purchase', {
    transaction_id: order.id,
    value: order.totalAmount ?? 0,
    currency: 'INR',
    shipping: order.shippingCharge ?? 0,
    ...(order.couponCode ? { coupon: order.couponCode } : {}),
    items: (order.items || []).map((i: any) => ({
      item_id: i.productId,
      item_name: i.title,
      price: i.unitPrice,
      quantity: i.quantity,
    })),
  });
}
