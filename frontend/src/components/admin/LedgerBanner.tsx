'use client';
import { money } from './AdminKit';

/**
 * Whether the books balance, stated before any other number on the screen.
 *
 * Every money figure in the admin derives from one identity:
 *
 *   GMV  =  seller receivable (items + shipping)  +  platform fee
 *
 * If that identity ever fails, every total below it is wrong and the operator
 * has no way to tell by looking. This banner is the tell — it is deliberately
 * loud when the difference is non-zero and quiet when it isn't, so a fault
 * cannot hide behind a screen full of confident-looking numbers.
 *
 * `ledger` comes from reconcile() in backend/src/common/money.ts.
 */
export default function LedgerBanner({ ledger }: { ledger?: any }) {
  if (!ledger) return null;
  const ok = !!ledger.reconciled;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        ok ? 'border-accent/25 bg-accent/[0.06]' : 'border-alert/40 bg-alert/[0.07]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white ${
              ok ? 'bg-accent' : 'bg-alert'
            }`}
            aria-hidden
          >
            {ok ? '✓' : '!'}
          </span>
          <div>
            <div className="text-[13px] font-extrabold uppercase tracking-wide text-slate">
              Ledger status: {ok ? 'Reconciled' : `Difference ${money(Math.abs(ledger.difference))}`}
            </div>
            <div className="text-[11.5px] text-dim">{ledger.formula}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px]">
          <Figure label="GMV" value={ledger.gmv} />
          <span className="text-pale">=</span>
          <Figure label="Seller receivable" value={ledger.sellerLiability} />
          <span className="text-pale">+</span>
          <Figure label="Platform fee" value={ledger.platformFee} />
        </div>
      </div>

      {!ok && (
        <p className="mt-2 border-t border-alert/25 pt-2 text-[12px] text-slate">
          {ledger.unreconciledOrders} order{ledger.unreconciledOrders === 1 ? '' : 's'} do not add up.
          Treat the totals on this page as unverified until this clears — do not settle payouts against them.
        </p>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-pale">{label} </span>
      <b className="text-slate">{money(value)}</b>
    </span>
  );
}
