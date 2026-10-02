import { useMemo, useState } from 'react'
import { Bike, Search, SlidersHorizontal } from 'lucide-react'
import { FilterBar, type RouteFilter } from './components/FilterBar'
import { RouteCard } from './components/RouteCard'
import { RouteDrawer } from './components/RouteDrawer'
import { mockRoutes, type BikeRoute } from './data/mockRoutes'

function App() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<RouteFilter>('all')
  const [selectedRoute, setSelectedRoute] = useState<BikeRoute | null>(null)

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mockRoutes.filter((route) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'dedicated'
          ? route.continuityScore === 100
          : route.cities.includes(activeFilter))

      const searchableText = [
        route.title,
        route.description,
        route.startPoint,
        route.endPoint,
        ...route.cities,
      ]
        .join(' ')
        .toLowerCase()

      return matchesFilter && searchableText.includes(normalizedQuery)
    })
  }, [activeFilter, query])

  return (
    <div className="min-h-screen bg-[#f7f7f3] text-slate-900">
      <header className="border-b border-stone-200 bg-[#f7f7f3]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-7">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-white shadow-sm">
              <Bike aria-hidden="true" size={23} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-xl font-extrabold tracking-[-0.035em] text-slate-950">
                MetroBike TLV
              </p>
              <p className="text-sm text-slate-500">Find your continuous route</p>
            </div>
          </div>

          <div className="relative w-full lg:max-w-md">
            <label className="sr-only" htmlFor="route-search">
              Search routes, cities, or landmarks
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />
            <input
              id="route-search"
              className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              placeholder="Search routes, cities, or landmarks"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section aria-labelledby="routes-heading">
          <div className="mb-8 flex flex-col gap-6">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
                <SlidersHorizontal aria-hidden="true" size={15} />
                Curated city rides
              </p>
              <h1
                id="routes-heading"
                className="text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl"
              >
                Keep riding, without the gaps.
              </h1>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Explore connected bike paths across Tel Aviv, Ramat Gan, and
                Givatayim.
              </p>
            </div>

            <FilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          <div className="mb-5 flex items-center justify-between border-t border-stone-200 pt-5">
            <p aria-live="polite" className="text-sm font-medium text-slate-500">
              {filteredRoutes.length}{' '}
              {filteredRoutes.length === 1 ? 'route' : 'routes'} found
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">
              Illustrative route data
            </p>
          </div>

          {filteredRoutes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoutes.map((route) => (
                <RouteCard key={route.id} route={route} onSelect={setSelectedRoute} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-slate-500">
                <Search aria-hidden="true" size={21} />
              </span>
              <h2 className="mt-5 text-lg font-bold text-slate-900">
                No routes found
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Try another search or choose a different city filter.
              </p>
            </div>
          )}
        </section>
      </main>

      {selectedRoute && (
        <RouteDrawer route={selectedRoute} onClose={() => setSelectedRoute(null)} />
      )}
    </div>
  )
}

export default App
