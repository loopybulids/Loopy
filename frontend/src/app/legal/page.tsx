import Link from 'next/link';
import { LegalShell, Policy } from '@/components/legal';
import { LEGAL_SECTIONS } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Legal Policies',
  description: 'Every Loopy policy in one place: terms, privacy, refunds, shipping, payouts and more.',
};

/**
 * The complete policy document, in document order, with a contents list.
 *
 * The topic-specific pages (/privacy, /terms, /refunds, …) render subsets of
 * the same sections, so nothing here is a second copy of the wording.
 */
export default function LegalPage() {
  return (
    <LegalShell
      title="Legal Policies"
      sub="Every policy governing Loopy, in one document."
      active="/legal"
    >
      <nav className="mt-8 rounded-xl border border-line bg-white p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-faint">Contents</div>
        <ol className="mt-2.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {LEGAL_SECTIONS.map((s) => (
            <li key={s.id} className="text-[13.5px]">
              <Link href={`#${s.id}`} className="text-muted transition-colors hover:text-navy">
                <span className="mr-1.5 font-num text-[12px] text-faint">{s.n}.</span>
                {s.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {LEGAL_SECTIONS.map((s) => <Policy key={s.id} section={s} />)}
    </LegalShell>
  );
}
