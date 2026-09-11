import { LegalShell, Policy } from '@/components/legal';
import { legalSections } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Selling on Loopy',
  description: 'The Seller Agreement, payout policy and rules for listing on Loopy.',
};

/**
 * Selling on Loopy.
 *
 * Rendered from the reviewed policy document via `legal-content.ts` — the
 * wording here is the wording in that document, not a paraphrase of it.
 */
export default function Page() {
  const sections = legalSections('seller-agreement', 'seller-payout-policy', 'prohibited-products-policy', 'community-guidelines', 'fraud-prevention-and-enforcement-policy');
  return (
    <LegalShell
      title="Selling on Loopy"
      sub="What is expected of a seller, how and when you are paid, and what you may not list."
      active="/sellers-terms"
    >
      {sections.map((s) => <Policy key={s.id} section={s} />)}
    </LegalShell>
  );
}
