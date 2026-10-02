export type RouteFilter =
  | 'all'
  | 'dedicated'
  | 'Tel Aviv'
  | 'Ramat Gan'
  | 'Givatayim'

interface FilterBarProps {
  activeFilter: RouteFilter
  onFilterChange: (filter: RouteFilter) => void
}

const filters: { label: string; value: RouteFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '100% Dedicated Lanes', value: 'dedicated' },
  { label: 'Tel Aviv', value: 'Tel Aviv' },
  { label: 'Ramat Gan', value: 'Ramat Gan' },
  { label: 'Givatayim', value: 'Givatayim' },
]

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div
      aria-label="Filter bike routes"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      role="group"
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value

        return (
          <button
            key={filter.value}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              isActive
                ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                : 'border-stone-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800'
            }`}
            type="button"
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
