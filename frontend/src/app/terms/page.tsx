import { LegalShell, Policy } from '@/components/legal';
import { legalPolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Terms of Service',
  description: 'The terms that govern use of Loopy by buyers and sellers.',
};

/**
 * Terms of Service.
 *
 * Rendered from the reviewed policy document via `legal-content.ts` — the
 * wording here is the wording in that document, not a paraphrase of it.
 */
export default function Page() {
  const policy = legalPolicy('/terms');
  return (
    <LegalShell
      title="Terms of Service"
      sub="The agreement between you and Loopy — who may use the platform, what we charge, and how disputes are handled."
      active="/terms"
    >
      {policy && <Policy policy={policy} />}
    </LegalShell>
  );
}
