/** Instant skeleton for command-center tabs — see seller/loading.tsx. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 px-5 py-6 sm:px-8" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-56 rounded-md bg-hair/70" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 rounded bg-hair/60" />
            <div className="mt-4 h-7 w-24 rounded-md bg-hair/70" />
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="h-4 w-40 rounded bg-hair/60" />
        <div className="mt-5 h-[220px] rounded-lg bg-hair/40" />
      </div>
    </div>
  );
}
