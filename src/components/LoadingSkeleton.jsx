export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-700"
        >
          <div className="skeleton w-2 h-2 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-1/3" />
            <div className="skeleton h-2.5 w-1/5" />
          </div>
          <div className="skeleton h-3 w-20 hidden sm:block" />
          <div className="skeleton h-3 w-16 hidden md:block" />
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
