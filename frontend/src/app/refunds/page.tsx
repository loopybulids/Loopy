import { LegalShell, Policy } from '@/components/legal';
import { legalSections } from '@/lib/legal-content';

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
  const sections = legalSections('refund-return-policy', 'cancellation-policy');
  return (
    <LegalShell
      title="Refunds & Returns"
      sub="How to raise a request, who decides it, and what happens to your money while it is being decided."
      active="/refunds"
    >
      {sections.map((s) => <Policy key={s.id} section={s} />)}
    </LegalShell>
  );
}
