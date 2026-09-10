import { BadRequestException } from '@nestjs/common';

/**
 * Coupon validation, in one place, used by both the preview endpoint and the
 * checkout that actually redeems.
 *
 * The preview and the redemption MUST agree, or a buyer is quoted one price
 * and charged another. Sharing this function is what guarantees that; the
 * discount is never taken from the client, only ever recomputed here.
 */

export interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
}

/** Normalised form of a code — coupons are matched case-insensitively. */
export const normalizeCode = (code: string) => String(code || '').trim().toUpperCase();

/**
 * How much a coupon takes off a given goods subtotal.
 *
 * `customerUses` is how many times this specific customer has already redeemed
 * it, which the caller counts; a guest checkout has no identity to count
 * against, so per-customer limits only bind signed-in buyers.
 */
export function discountFor(
  coupon: CouponRow,
  itemsSubtotal: number,
  opts: { customerUses?: number; now?: Date } = {},
): number {
  const now = opts.now ?? new Date();

  if (!coupon.active) throw new BadRequestException('That code is no longer active.');
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    throw new BadRequestException('That code isn’t active yet.');
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    throw new BadRequestException('That code has expired.');
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new BadRequestException('That code has been fully redeemed.');
  }
  if (coupon.perCustomerLimit != null && (opts.customerUses ?? 0) >= coupon.perCustomerLimit) {
    throw new BadRequestException('You’ve already used that code.');
  }
  if (itemsSubtotal < coupon.minOrder) {
    throw new BadRequestException(`That code needs a minimum order of ₹${coupon.minOrder}.`);
  }

  const raw =
    coupon.type === 'fixed'
      ? coupon.value
      : Math.round((itemsSubtotal * coupon.value) / 100);

  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;

  // Never exceed the goods value: a discount bigger than the cart would make
  // the fee negative and turn the order into a payout to the customer.
  return Math.min(Math.max(capped, 0), itemsSubtotal);
}

/** Short human description of what a coupon does, for the buyer's UI. */
export function describeCoupon(coupon: CouponRow): string {
  const off = coupon.type === 'fixed' ? `₹${coupon.value} off` : `${coupon.value}% off`;
  const cap = coupon.type === 'percent' && coupon.maxDiscount != null ? ` (max ₹${coupon.maxDiscount})` : '';
  const min = coupon.minOrder ? ` on orders over ₹${coupon.minOrder}` : '';
  return `${off}${cap}${min}`;
}
