/** Instant storefront skeleton — see seller/loading.tsx. */
export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse bg-paper" aria-busy="true" aria-label="Loading">
      <div className="h-16 border-b border-line bg-white" />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="h-32 rounded-2xl bg-line/40" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-[4/5] bg-line/40" />
              <div className="space-y-2 p-3.5">
                <div className="h-3.5 w-3/4 rounded bg-line/60" />
                <div className="h-3.5 w-1/3 rounded bg-line/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
