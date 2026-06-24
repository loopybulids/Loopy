import Link from 'next/link';
import { Loop } from '@/components/icons';

export function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-[15px] font-extrabold text-navy">{n}. {title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

const TABS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/legal', label: 'Legal' },
];

export function LegalShell({ title, active, children }: { title: string; active: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper text-navy">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-display text-[22px] font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-green-mint"><Loop size={17} /></span> Loopy
          </Link>
          <Link href="/" className="text-[14px] font-semibold text-muted hover:text-navy">← Back home</Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight sm:text-[44px]">{title}</h1>
        <p className="mt-2 text-[13px] text-faint">Last updated: 24 June 2026</p>

        {/* sub-nav between the three legal pages */}
        <nav className="mt-6 flex gap-2 border-b border-line pb-3">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition-colors ${active === t.href ? 'bg-navy text-white' : 'text-muted hover:bg-white hover:text-navy'}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {children}
      </article>
    </main>
  );
}
