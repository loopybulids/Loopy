import { LegalShell, Policy } from '@/components/legal';
import { legalSections } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Privacy Policy',
  description: 'How Loopy collects, uses and shares your personal information.',
};

/**
 * Privacy Policy.
 *
 * Rendered from the reviewed policy document via `legal-content.ts` — the
 * wording here is the wording in that document, not a paraphrase of it.
 */
export default function Page() {
  const sections = legalSections('privacy', 'cookies');
  return (
    <LegalShell
      title="Privacy Policy"
      sub="What we collect from buyers and sellers, why we hold it, who we share it with, and the rights you have over it."
      active="/privacy"
    >
      {sections.map((s) => <Policy key={s.id} section={s} />)}
    </LegalShell>
  );
}
