import Link from 'next/link';
import Logo from '@/components/Logo';
import { LEGAL_META, type LegalSection } from '@/lib/legal-content';

/** The policy pages, in the order they appear in the footer and on /legal. */
export const LEGAL_NAV = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refunds', label: 'Refunds & returns' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/sellers-terms', label: 'Selling on Loopy' },
  { href: '/legal', label: 'All policies' },
];

/**
 * One numbered clause of hand-written copy.
 *
 * Kept for the few places that summarise rather than quote the policy
 * document; anything that states a binding term should render from
 * `legal-content.ts` via <Policy> so the site and the document cannot diverge.
 */
export function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-[15px] font-bold text-navy">{n}. {title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/** Paragraphs and bullet lists as they appear in the policy document. */
function Blocks({ blocks }: { blocks: { kind: 'p' | 'li'; text: string }[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: string) => {
    if (!list.length) return;
    out.push(
      <ul key={key} className="mt-2 space-y-1.5 pl-1">
        {list.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-muted">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-green/60" />
            <span>{t}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  blocks.forEach((b, i) => {
    if (b.kind === 'li') {
      list.push(b.text);
      return;
    }
    flush(`l${i}`);
    out.push(
      <p key={`p${i}`} className="mt-2.5 text-[14px] leading-relaxed text-muted">{b.text}</p>,
    );
  });
  flush('l-end');

  return <>{out}</>;
}

/** One full section of the policy document, numbered as in the document. */
export function Policy({ section }: { section: LegalSection }) {
  return (
    <section id={section.id} className="mt-10 scroll-mt-24 border-t border-line pt-8 first:mt-6 first:border-0 first:pt-0">
      <h2 className="font-display text-[20px] font-bold tracking-tight text-navy">
        <span className="text-faint">{section.n}.</span> {section.title}
      </h2>

      <Blocks blocks={section.intro} />

      {section.subs.map((sub) => (
        <div key={sub.no} className="mt-5">
          <h3 className="font-display text-[14.5px] font-bold text-navy">
            {sub.no} {sub.title}
          </h3>
          <Blocks blocks={sub.blocks} />
        </div>
      ))}
    </section>
  );
}

export function LegalShell({
  title, sub, children, active,
}: {
  title: string;
  /** One line under the heading saying what this page covers. */
  sub?: string;
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <main className="min-h-screen bg-paper text-navy">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
            <Logo height={30} />
          </Link>
          <Link href="/" className="text-[14px] font-semibold text-muted hover:text-navy">← Back home</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-[34px] font-bold tracking-tight sm:text-[42px]">{title}</h1>
        {sub && <p className="mt-2 text-[15px] leading-relaxed text-muted">{sub}</p>}

        {/* Provenance: who this covers, how to reach us, and whether it is in force. */}
        <div className="mt-5 rounded-xl border border-line bg-white p-4 text-[13px] leading-relaxed text-muted">
          <div>
            <b className="text-navy">LoopyNow</b> ·{' '}
            <a href={LEGAL_META.site} className="underline decoration-line hover:text-navy">
              {LEGAL_META.site.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <div className="mt-0.5">
            Questions:{' '}
            <a href={`mailto:${LEGAL_META.contact}`} className="font-semibold text-navy underline decoration-line">
              {LEGAL_META.contact}
            </a>
          </div>
          {LEGAL_META.lastUpdated && (
            <div className="mt-0.5">Last updated {LEGAL_META.lastUpdated}.</div>
          )}
        </div>

        {/* sibling policies */}
        <nav className="mt-5 flex flex-wrap gap-2">
          {LEGAL_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                active === n.href
                  ? 'bg-navy text-white'
                  : 'border border-line bg-white text-muted hover:text-navy'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {children}

      </article>
    </main>
  );
}
