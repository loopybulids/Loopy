import Link from 'next/link';

export default function ApiDown({ what = 'this page' }: { what?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6">
      <div className="card max-w-md p-7 text-center">
        <div className="text-4xl">🔌</div>
        <h1 className="mt-3 font-serif text-[22px] font-semibold">Can’t reach the Loopy API</h1>
        <p className="mt-2 text-sm text-muted">
          {what} loads data from the backend on <b>http://localhost:4000</b>, which doesn’t seem to be running.
        </p>
        <div className="mt-4 rounded-xl bg-paper p-3 text-left text-[12px] text-ink2">
          Open a terminal and run:
          <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px]">cd backend
npm run dev</pre>
        </div>
        <Link href="/" className="btn-pri mt-5 inline-flex">Back to home</Link>
      </div>
    </main>
  );
}
