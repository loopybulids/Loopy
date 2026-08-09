/**
 * Shown the instant a console tab is clicked, while the route's payload loads.
 * Without it the browser sits on the *previous* page until the next one is
 * ready, which reads as "the button did nothing".
 */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-6 w-52 rounded-md bg-line/70" />
        <div className="h-3.5 w-72 rounded bg-line/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 rounded bg-line/60" />
            <div className="mt-4 h-7 w-28 rounded-md bg-line/70" />
            <div className="mt-3 h-3 w-16 rounded bg-line/50" />
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="h-4 w-40 rounded bg-line/60" />
        <div className="mt-5 space-y-3.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-line/60" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-line/60" />
                <div className="h-3 w-1/2 rounded bg-line/40" />
              </div>
              <div className="h-3.5 w-16 rounded bg-line/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
