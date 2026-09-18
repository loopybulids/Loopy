import Link from 'next/link';
import { LegalShell, Policy } from '@/components/legal';
import { LEGAL_GLANCE, LEGAL_SECTIONS } from '@/lib/legal-content';

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
      {/*
        The document's own summary for buyers. Presented as a summary and
        labelled as one — it says itself that it does not replace the terms
        below, and a page that quietly dropped that caveat would be making a
        promise the policy does not.
      */}
      {LEGAL_GLANCE.length > 0 && (
        <section className="mt-8 rounded-xl border border-green/25 bg-green-soft/40 p-5">
          <h2 className="font-display text-[15px] font-bold text-navy">Important terms — at a glance</h2>
          <p className="mt-0.5 text-[12.5px] text-muted">
            A plain-language summary for convenience. It is not a substitute for the full Articles below, which govern.
          </p>
          <ul className="mt-3 space-y-2">
            {LEGAL_GLANCE.map((g) => (
              <li key={g} className="flex gap-2 text-[13.5px] leading-relaxed text-navy/85">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
