import {
  ArrowLeft,
  ChevronRight,
  Droplets,
  Flag,
  Gauge,
  MapPin,
  MapPinned,
  Minus,
  Route as RouteIcon,
  RefreshCw,
  SlidersHorizontal,
  Toilet,
} from 'lucide-react'
import type { BikeRoute } from '../data/routes'
import type { RouteAmenity } from '../utils/routePois'
import {
  countActiveRouteFilters,
  DEFAULT_ROUTE_FILTERS,
  type RouteFiltersState,
} from '../utils/routeFilters'

interface RoutesPanelProps {
  routes: BikeRoute[]
  totalRouteCount: number
  unfilteredRouteCount: number
  selectedRoute: BikeRoute | null
  amenitiesByRoute: Record<string, RouteAmenity[]>
  filters: RouteFiltersState
  isCollapsed: boolean
  onSelectRoute: (route: BikeRoute) => void
  onClearRoute: () => void
  onFiltersChange: (filters: RouteFiltersState) => void
  onToggle: () => void
}

export function RoutesPanel({
  routes,
  totalRouteCount,
  unfilteredRouteCount,
  selectedRoute,
  amenitiesByRoute,
  filters,
  isCollapsed,
  onSelectRoute,
  onClearRoute,
  onFiltersChange,
  onToggle,
}: RoutesPanelProps) {
  if (isCollapsed) {
    return (
      <button
        aria-expanded="false"
        className="absolute bottom-4 right-3 z-[1200] inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-auto sm:right-5 sm:top-5"
        type="button"
        onClick={onToggle}
      >
        <MapPinned aria-hidden="true" size={18} />
        {selectedRoute
          ? selectedRoute.title
          : `${routes.length} ${routes.length === 1 ? 'route' : 'routes'} in view`}
      </button>
    )
  }

  const selectedAmenities = selectedRoute
    ? amenitiesByRoute[selectedRoute.id] ?? []
    : []

  return (
    <aside
      aria-label="Mapped bike routes"
      className="absolute bottom-3 left-3 right-3 z-[1200] flex max-h-[72%] flex-col overflow-hidden rounded-3xl border border-white/70 bg-[#fbfbf8]/97 shadow-2xl backdrop-blur sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:max-h-[calc(100%-2.5rem)] sm:w-[23rem]"
    >
      {selectedRoute ? (
        <RouteDetails
          amenities={selectedAmenities}
          route={selectedRoute}
          onBack={onClearRoute}
          onCollapse={onToggle}
        />
      ) : (
        <RouteList
          amenitiesByRoute={amenitiesByRoute}
          filters={filters}
          routes={routes}
          totalRouteCount={totalRouteCount}
          unfilteredRouteCount={unfilteredRouteCount}
          onCollapse={onToggle}
          onFiltersChange={onFiltersChange}
          onSelectRoute={onSelectRoute}
        />
      )}
    </aside>
  )
}

interface RouteListProps {
  routes: BikeRoute[]
  totalRouteCount: number
  unfilteredRouteCount: number
  amenitiesByRoute: Record<string, RouteAmenity[]>
  filters: RouteFiltersState
  onCollapse: () => void
  onFiltersChange: (filters: RouteFiltersState) => void
  onSelectRoute: (route: BikeRoute) => void
}

function RouteList({
  routes,
  totalRouteCount,
  unfilteredRouteCount,
  amenitiesByRoute,
  filters,
  onCollapse,
  onFiltersChange,
  onSelectRoute,
}: RouteListProps) {
  const activeFilterCount = countActiveRouteFilters(filters)

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            {routes.length} in view · {totalRouteCount} matching
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950">
            Generated routes
          </h2>
        </div>
        <CollapseButton onClick={onCollapse} />
      </div>

      <div className="overflow-y-auto p-3">
        <RouteFilters
          activeFilterCount={activeFilterCount}
          filters={filters}
          routeCount={unfilteredRouteCount}
          onChange={onFiltersChange}
        />

        {routes.length > 0 ? (
          <div className="mt-3 space-y-2">
            {routes.map((route) => {
              const amenities = amenitiesByRoute[route.id] ?? []
              const fountains = amenities.filter(
                (amenity) => amenity.type === 'fountain',
              ).length
              const restrooms = amenities.filter(
                (amenity) => amenity.type === 'restroom',
              ).length

              return (
                <button
                  key={route.id}
                  className="group w-full rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  type="button"
                  onClick={() => onSelectRoute(route)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{route.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {route.distanceKm} km · {route.difficulty}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
                      size={19}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {route.cities.map((city) => (
                      <span
                        key={city}
                        className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {city}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      <Droplets aria-hidden="true" size={12} />
                      {fountains}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      <Toilet aria-hidden="true" size={12} />
                      {restrooms}
                    </span>
                    {route.isRoundTrip && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <RefreshCw aria-hidden="true" size={12} />
                        Round trip
                      </span>
                    )}
                    {route.usesRepeatedSegments && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Retraces path
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8 text-center">
            <MapPinned aria-hidden="true" className="mx-auto text-slate-400" size={24} />
            <h3 className="mt-3 font-bold text-slate-800">No mapped routes here</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Pan the map or loosen the filters to discover more routes.
            </p>
          </div>
        )}
        <p className="px-2 pb-1 pt-4 text-xs leading-5 text-slate-500">
          Routes are generated only from connected infrastructure in the current
          OpenStreetMap export.
        </p>
      </div>
    </>
  )
}

interface RouteFiltersProps {
  filters: RouteFiltersState
  activeFilterCount: number
  routeCount: number
  onChange: (filters: RouteFiltersState) => void
}

function RouteFilters({
  filters,
  activeFilterCount,
  routeCount,
  onChange,
}: RouteFiltersProps) {
  const selectClassName =
    'mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-700'
  const inputClassName =
    'mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-emerald-700'
  const hasInvalidDistanceRange =
    filters.minDistanceKm !== null &&
    filters.maxDistanceKm !== null &&
    filters.minDistanceKm > filters.maxDistanceKm
  const parseDistance = (value: string) =>
    value === '' ? null : Math.max(0, Number(value))

  return (
    <details className="rounded-2xl border border-stone-200 bg-stone-50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-700">
        <SlidersHorizontal aria-hidden="true" size={16} />
        Filter {routeCount} generated routes
        {activeFilterCount > 0 && (
          <span className="ml-auto rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] text-white">
            {activeFilterCount} active
          </span>
        )}
      </summary>

      <div className="border-t border-stone-200 p-3">
        <label className="block text-xs font-bold text-slate-500">
          Sort routes
          <select
            className={selectClassName}
            value={filters.sort}
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.target.value as RouteFiltersState['sort'],
              })
            }
          >
            <option value="length-desc">Length: longest first</option>
            <option value="length-asc">Length: shortest first</option>
            <option value="difficulty-asc">Difficulty: easy first</option>
            <option value="difficulty-desc">Difficulty: hard first</option>
          </select>
        </label>

        <fieldset className="mt-3">
          <legend className="text-xs font-bold text-slate-500">
            Distance range (km)
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Minimum
              <input
                aria-invalid={hasInvalidDistanceRange}
                className={inputClassName}
                inputMode="decimal"
                min={0}
                placeholder="No minimum"
                step={0.1}
                type="number"
                value={filters.minDistanceKm ?? ''}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    minDistanceKm: parseDistance(event.target.value),
                  })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Maximum
              <input
                aria-invalid={hasInvalidDistanceRange}
                className={inputClassName}
                inputMode="decimal"
                min={0}
                placeholder="No maximum"
                step={0.1}
                type="number"
                value={filters.maxDistanceKm ?? ''}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    maxDistanceKm: parseDistance(event.target.value),
                  })
                }
              />
            </label>
          </div>
          {hasInvalidDistanceRange && (
            <p className="mt-1.5 text-xs font-semibold text-rose-700" role="alert">
              Minimum distance must not exceed maximum distance.
            </p>
          )}
        </fieldset>

        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white p-3">
          <input
            checked={filters.roundTrip}
            className="mt-0.5 size-4 accent-emerald-700"
            type="checkbox"
            onChange={(event) =>
              onChange({ ...filters, roundTrip: event.target.checked })
            }
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <RefreshCw aria-hidden="true" size={14} />
              Generate round trips
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Combine connected paths into loops that start and finish together.
            </span>
          </span>
        </label>

        <label
          className={`mt-2 flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 ${
            filters.roundTrip
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-50'
          }`}
        >
          <input
            checked={filters.allowRetracing}
            className="mt-0.5 size-4 accent-emerald-700"
            disabled={!filters.roundTrip}
            type="checkbox"
            onChange={(event) =>
              onChange({ ...filters, allowRetracing: event.target.checked })
            }
          />
          <span>
            <span className="text-sm font-bold text-slate-700">
              Allow repeated return paths
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Include out-and-back rides that return along the same path.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="mt-2 text-xs font-bold text-slate-500">
            Difficulty
            <select
              className={selectClassName}
              value={filters.difficulty}
              onChange={(event) =>
                onChange({
                  ...filters,
                  difficulty: event.target.value as RouteFiltersState['difficulty'],
                })
              }
            >
              <option value="all">Any difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
          <label className="mt-2 text-xs font-bold text-slate-500">
            City
            <select
              className={selectClassName}
              value={filters.city}
              onChange={(event) =>
                onChange({
                  ...filters,
                  city: event.target.value as RouteFiltersState['city'],
                })
              }
            >
              <option value="all">All cities</option>
              <option value="Tel Aviv">Tel Aviv</option>
              <option value="Ramat Gan">Ramat Gan</option>
              <option value="Givatayim">Givatayim</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2" role="group" aria-label="Required amenities">
          <AmenityToggle
            active={filters.hasWater}
            icon={<Droplets aria-hidden="true" size={14} />}
            label="Water"
            onClick={() => onChange({ ...filters, hasWater: !filters.hasWater })}
          />
          <AmenityToggle
            active={filters.hasRestroom}
            icon={<Toilet aria-hidden="true" size={14} />}
            label="Restrooms"
            onClick={() =>
              onChange({ ...filters, hasRestroom: !filters.hasRestroom })
            }
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            className="mt-3 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-emerald-700"
            type="button"
            onClick={() => onChange(DEFAULT_ROUTE_FILTERS)}
          >
            Clear all filters
          </button>
        )}
      </div>
    </details>
  )
}

function AmenityToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-emerald-700 ${
        active
          ? 'border-emerald-700 bg-emerald-700 text-white'
          : 'border-stone-200 bg-white text-slate-600'
      }`}
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

interface RouteDetailsProps {
  route: BikeRoute
  amenities: RouteAmenity[]
  onBack: () => void
  onCollapse: () => void
}

function RouteDetails({ route, amenities, onBack, onCollapse }: RouteDetailsProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <button
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          All routes
        </button>
        <CollapseButton onClick={onCollapse} />
      </div>

      <div className="overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-1.5">
          {route.cities.map((city) => (
            <span
              key={city}
              className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800"
            >
              {city}
            </span>
          ))}
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
          {route.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{route.description}</p>

        <dl className="mt-5 grid grid-cols-3 gap-2">
          <RouteStat icon={<RouteIcon size={16} />} label="Length" value={`${route.distanceKm} km`} />
          <RouteStat icon={<Gauge size={16} />} label="Difficulty" value={route.difficulty} />
          <RouteStat icon={<MapPinned size={16} />} label="Dedicated" value={`${route.continuityScore}%`} />
        </dl>

        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          {route.isRoundTrip ? (
            <LocationRow
              icon={<RefreshCw size={16} />}
              label="Start & finish"
              value={route.startPoint}
            />
          ) : (
            <>
              <LocationRow icon={<MapPin size={16} />} label="Start" value={route.startPoint} />
              <div className="my-3 ml-2 h-5 border-l border-dashed border-stone-300" />
              <LocationRow icon={<Flag size={16} />} label="Finish" value={route.endPoint} />
            </>
          )}
        </div>

        <section aria-labelledby="nearby-amenities-heading" className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 id="nearby-amenities-heading" className="flex items-center gap-2 font-extrabold text-slate-950">
              <Droplets aria-hidden="true" className="text-sky-600" size={18} />
              Amenities nearby
            </h3>
            <span className="text-xs font-bold text-slate-400">Within 200 m</span>
          </div>

          {amenities.length > 0 ? (
            <ul className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {amenities.slice(0, 6).map((amenity) => (
                <li key={amenity.id} className="flex items-center gap-3 px-4 py-3">
                  {amenity.type === 'fountain' ? (
                    <Droplets aria-hidden="true" className="shrink-0 text-sky-600" size={15} />
                  ) : (
                    <Toilet aria-hidden="true" className="shrink-0 text-violet-600" size={15} />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {amenity.name}
                  </span>
                  <span className={`shrink-0 text-xs font-bold ${amenity.type === 'fountain' ? 'text-sky-700' : 'text-violet-700'}`}>
                    {amenity.distanceMeters} m
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-sm text-slate-500">
              No mapped water fountains or restrooms were found near this route.
            </p>
          )}
          {amenities.length > 6 && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Showing the closest 6 of {amenities.length} amenities.
            </p>
          )}
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Built from connected OpenStreetMap geometry. Check current street
          conditions before riding.
        </p>
      </div>
    </>
  )
}

function CollapseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Collapse routes panel"
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-500 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      type="button"
      onClick={onClick}
    >
      <Minus aria-hidden="true" size={18} />
    </button>
  )
}

interface RouteStatProps {
  icon: React.ReactNode
  label: string
  value: string
}

function RouteStat({ icon, label, value }: RouteStatProps) {
  return (
    <div className="rounded-2xl bg-stone-100 p-3">
      <dt className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-extrabold text-slate-800">{value}</dd>
    </div>
  )
}

interface LocationRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function LocationRow({ icon, label, value }: LocationRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-emerald-700">{icon}</span>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}
