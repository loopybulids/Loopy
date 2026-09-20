import { LegalShell, Policy } from '@/components/legal';
import { legalPolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Refunds & Returns',
  description: 'How refund, return and cancellation requests are handled on Loopy.',
};

/**
 * Refunds & Returns.
 *
 * Rendered from the reviewed policy document via `legal-content.ts` — the
 * wording here is the wording in that document, not a paraphrase of it.
 */
export default function Page() {
  const policy = legalPolicy('/refunds');
  return (
    <LegalShell
      title="Refunds & Returns"
      sub="How to raise a request, who decides it, and what happens to your money while it is being decided."
      active="/refunds"
    >
      {policy && <Policy policy={policy} />}
    </LegalShell>
  );
}
