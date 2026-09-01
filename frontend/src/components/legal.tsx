import Link from 'next/link';
import Logo from '@/components/Logo';

export function Clause({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-display text-[15px] font-extrabold text-navy">{n}. {title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function LegalShell({ title, children }: { title: string; active?: string; children: React.ReactNode }) {
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
        <h1 className="font-display text-[34px] font-extrabold tracking-tight sm:text-[44px]">{title}</h1>
        {children}
      </article>
    </main>
  );
}
