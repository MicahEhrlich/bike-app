import { ArrowUpRight, Bike, Route } from 'lucide-react'
import type { BikeRoute } from '../data/mockRoutes'

interface RouteCardProps {
  route: BikeRoute
  onSelect: (route: BikeRoute) => void
}

export function RouteCard({ route, onSelect }: RouteCardProps) {
  const difficultyColor =
    route.difficulty === 'Easy'
      ? 'text-emerald-700'
      : route.difficulty === 'Moderate'
        ? 'text-amber-700'
        : 'text-rose-700'

  return (
    <button
      aria-label={`View details for ${route.title}`}
      className="group flex h-full w-full flex-col rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:p-6"
      type="button"
      onClick={() => onSelect(route)}
    >
      <div className="mb-8 flex w-full items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
          <Bike aria-hidden="true" size={21} strokeWidth={2} />
        </div>
        <ArrowUpRight
          aria-hidden="true"
          className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700"
          size={21}
        />
      </div>

      <div className="mb-5 flex-1">
        <h3 className="text-xl font-bold tracking-[-0.025em] text-slate-900">
          {route.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
            <Route aria-hidden="true" size={16} />
            {route.distanceKm} km
          </span>
          <span aria-hidden="true" className="size-1 rounded-full bg-stone-300" />
          <span className={`font-semibold ${difficultyColor}`}>
            {route.difficulty}
          </span>
        </div>
      </div>

      <div className="w-full border-t border-stone-100 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Dedicated path
          </span>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-sm font-bold text-teal-700">
            {route.continuityScore}%
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {route.cities.map((city) => (
            <span
              key={city}
              className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
