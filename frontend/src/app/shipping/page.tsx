import { LegalShell, Policy } from '@/components/legal';
import { legalPolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Shipping Policy',
  description: 'Who is responsible for delivery of an order placed on Loopy.',
};

/**
 * Shipping Policy.
 *
 * Rendered from the reviewed policy document via `legal-content.ts` — the
 * wording here is the wording in that document, not a paraphrase of it.
 */
export default function Page() {
  const policy = legalPolicy('/shipping');
  return (
    <LegalShell
      title="Shipping Policy"
      sub="Sellers arrange and are responsible for shipping. This explains tracking, charges, and what happens when a delivery goes wrong."
      active="/shipping"
    >
      {policy && <Policy policy={policy} />}
    </LegalShell>
  );
}
