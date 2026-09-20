import Link from 'next/link';
import { LegalShell, Policy } from '@/components/legal';
import { LEGAL_POLICIES, legalPolicy } from '@/lib/legal-content';

export const metadata = {
  title: 'Loopy — Legal Policies',
  description: 'Every Loopy policy in one place: terms, privacy, refunds, shipping and selling.',
};

/**
 * Every policy, in document order, with a contents list.
 *
 * The topic pages (/terms, /privacy, /refunds, …) render exactly one of these
 * each, from the same generated file, so nothing here is a second copy of the
 * wording.
 */
export default function LegalPage() {
  // The document's own index page: a one-line description of each policy.
  const index = legalPolicy('/legal');
  const policies = LEGAL_POLICIES.filter((p) => p.id !== 'legal');

  return (
    <LegalShell
      title="Legal Policies"
      sub="Every policy governing Loopy, in one place."
      active="/legal"
    >
      {index && index.intro.length > 0 && (
        <section className="mt-8 rounded-xl border border-green/25 bg-green-soft/40 p-5">
          <h2 className="font-display text-[15px] font-bold text-navy">What each policy covers</h2>
          <ul className="mt-3 space-y-2">
            {index.intro.map((b) => (
              <li key={b.text} className="flex gap-2 text-[13.5px] leading-relaxed text-navy/85">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="mt-8 rounded-xl border border-line bg-white p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.09em] text-faint">Contents</div>
        <ol className="mt-2.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {policies.map((p, i) => (
            <li key={p.id} className="text-[13.5px]">
              <Link href={`#${p.id}`} className="text-muted transition-colors hover:text-navy">
                <span className="mr-1.5 font-num text-[12px] text-faint">{i + 1}.</span>
                {p.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {policies.map((p) => <Policy key={p.id} policy={p} heading />)}
    </LegalShell>
  );
}
