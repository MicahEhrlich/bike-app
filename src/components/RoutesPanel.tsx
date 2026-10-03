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
import { useTranslation } from 'react-i18next'
import type { BikeRoute } from '../data/routes'
import type { RouteAmenity } from '../utils/routePois'
import {
  countActiveRouteFilters,
  DEFAULT_ROUTE_FILTERS,
  type RouteFiltersState,
} from '../utils/routeFilters'
import {
  formatNumber,
  getLocalizedAmenityName,
  getRouteLabels,
  getSupportedLanguage,
  translateCity,
  translateDifficulty,
} from '../utils/localization'

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
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)

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
          ? getRouteLabels(selectedRoute, t).title
          : t('routes.inView', {
              count: formatNumber(routes.length, language, 0),
            })}
      </button>
    )
  }

  const selectedAmenities = selectedRoute
    ? amenitiesByRoute[selectedRoute.id] ?? []
    : []

  return (
    <aside
      aria-label={t('routes.panelLabel')}
      className="absolute bottom-3 left-3 right-3 z-[1200] flex max-h-[72%] flex-col overflow-hidden rounded-3xl border border-white/70 bg-[#fbfbf8]/97 shadow-2xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/97 sm:bottom-auto sm:left-auto sm:right-5 sm:top-5 sm:max-h-[calc(100%-2.5rem)] sm:w-[23rem]"
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
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const activeFilterCount = countActiveRouteFilters(filters)

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            {t('routes.matching', {
              visible: formatNumber(routes.length, language, 0),
              total: formatNumber(totalRouteCount, language, 0),
            })}
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-slate-950">
            {t('routes.heading')}
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
              const labels = getRouteLabels(route, t)

              return (
                <button
                  key={route.id}
                  className="group w-full rounded-2xl border border-stone-200 bg-white p-4 text-start transition hover:border-emerald-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  type="button"
                  onClick={() => onSelectRoute(route)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{labels.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {t('units.kilometers', {
                          value: formatNumber(route.distanceKm, language),
                        })}{' '}
                        · {translateDifficulty(route.difficulty, t)}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 rtl:rotate-180"
                      size={19}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {route.cities.map((city) => (
                      <span
                        key={city}
                        className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {translateCity(city, t)}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      <Droplets aria-hidden="true" size={12} />
                      {formatNumber(fountains, language, 0)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      <Toilet aria-hidden="true" size={12} />
                      {formatNumber(restrooms, language, 0)}
                    </span>
                    {route.isRoundTrip && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <RefreshCw aria-hidden="true" size={12} />
                        {t('routes.roundTrip')}
                      </span>
                    )}
                    {route.usesRepeatedSegments && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {t('routes.retracesPath')}
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
            <h3 className="mt-3 font-bold text-slate-800">
              {t('routes.noRoutesTitle')}
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {t('routes.noRoutesBody')}
            </p>
          </div>
        )}
        <p className="px-2 pb-1 pt-4 text-xs leading-5 text-slate-500">
          {t('routes.sourceNotice')}
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
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
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
        {t('routes.filterSummary', {
          count: formatNumber(routeCount, language, 0),
        })}
        {activeFilterCount > 0 && (
          <span className="ms-auto rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] text-white">
            {t('routes.activeFilters', {
              count: formatNumber(activeFilterCount, language, 0),
            })}
          </span>
        )}
      </summary>

      <div className="border-t border-stone-200 p-3">
        <label className="block text-xs font-bold text-slate-500">
          {t('routes.sortLabel')}
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
            <option value="length-desc">{t('routes.sortLengthDesc')}</option>
            <option value="length-asc">{t('routes.sortLengthAsc')}</option>
            <option value="difficulty-asc">{t('routes.sortDifficultyAsc')}</option>
            <option value="difficulty-desc">{t('routes.sortDifficultyDesc')}</option>
          </select>
        </label>

        <fieldset className="mt-3">
          <legend className="text-xs font-bold text-slate-500">
            {t('routes.distanceRange')}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-500">
              {t('routes.minimum')}
              <input
                aria-invalid={hasInvalidDistanceRange}
                className={inputClassName}
                inputMode="decimal"
                min={0}
                placeholder={t('routes.noMinimum')}
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
              {t('routes.maximum')}
              <input
                aria-invalid={hasInvalidDistanceRange}
                className={inputClassName}
                inputMode="decimal"
                min={0}
                placeholder={t('routes.noMaximum')}
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
            <p className="mt-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300" role="alert">
              {t('routes.invalidRange')}
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
              {t('routes.generateRoundTrips')}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              {t('routes.generateRoundTripsHelp')}
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
              {t('routes.allowRetracing')}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              {t('routes.allowRetracingHelp')}
            </span>
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="mt-2 text-xs font-bold text-slate-500">
            {t('routes.difficultyLabel')}
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
              <option value="all">{t('routes.anyDifficulty')}</option>
              <option value="Easy">{t('difficulty.easy')}</option>
              <option value="Moderate">{t('difficulty.moderate')}</option>
              <option value="Hard">{t('difficulty.hard')}</option>
            </select>
          </label>
          <label className="mt-2 text-xs font-bold text-slate-500">
            {t('routes.cityLabel')}
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
              <option value="all">{t('routes.allCities')}</option>
              <option value="Tel Aviv">{t('cities.telAviv')}</option>
              <option value="Ramat Gan">{t('cities.ramatGan')}</option>
              <option value="Givatayim">{t('cities.givatayim')}</option>
            </select>
          </label>
        </div>

        <div
          className="mt-3 flex gap-2"
          role="group"
          aria-label={t('routes.requiredAmenities')}
        >
          <AmenityToggle
            active={filters.hasWater}
            icon={<Droplets aria-hidden="true" size={14} />}
            label={t('routes.water')}
            onClick={() => onChange({ ...filters, hasWater: !filters.hasWater })}
          />
          <AmenityToggle
            active={filters.hasRestroom}
            icon={<Toilet aria-hidden="true" size={14} />}
            label={t('routes.restrooms')}
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
            {t('routes.clearFilters')}
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
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const labels = getRouteLabels(route, t)

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <button
          className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" className="rtl:rotate-180" size={17} />
          {t('routes.allRoutes')}
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
              {translateCity(city, t)}
            </span>
          ))}
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-slate-950">
          {labels.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {labels.description}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2">
          <RouteStat
            icon={<RouteIcon size={16} />}
            label={t('routes.length')}
            value={t('units.kilometers', {
              value: formatNumber(route.distanceKm, language),
            })}
          />
          <RouteStat
            icon={<Gauge size={16} />}
            label={t('routes.difficultyLabel')}
            value={translateDifficulty(route.difficulty, t)}
          />
          <RouteStat
            icon={<MapPinned size={16} />}
            label={t('routes.dedicated')}
            value={`${formatNumber(route.continuityScore, language, 0)}%`}
          />
        </dl>

        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          {route.isRoundTrip ? (
            <LocationRow
              icon={<RefreshCw size={16} />}
              label={t('routes.startAndFinish')}
              value={labels.startPoint}
            />
          ) : (
            <>
              <LocationRow
                icon={<MapPin size={16} />}
                label={t('routes.start')}
                value={labels.startPoint}
              />
              <div className="my-3 ms-2 h-5 border-s border-dashed border-stone-300" />
              <LocationRow
                icon={<Flag size={16} />}
                label={t('routes.finish')}
                value={labels.endPoint}
              />
            </>
          )}
        </div>

        <section aria-labelledby="nearby-amenities-heading" className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 id="nearby-amenities-heading" className="flex items-center gap-2 font-extrabold text-slate-950">
              <Droplets aria-hidden="true" className="text-sky-600" size={18} />
              {t('routes.nearbyAmenities')}
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {t('routes.withinDistance')}
            </span>
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
                    {getLocalizedAmenityName(amenity, language, t)}
                  </span>
                  <span className={`shrink-0 text-xs font-bold ${amenity.type === 'fountain' ? 'text-sky-700' : 'text-violet-700'}`}>
                    {t('units.meters', {
                      value: formatNumber(amenity.distanceMeters, language, 0),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-5 text-sm text-slate-500">
              {t('routes.noAmenities')}
            </p>
          )}
          {amenities.length > 6 && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t('routes.showingAmenities', {
                count: formatNumber(amenities.length, language, 0),
              })}
            </p>
          )}
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500">
          {t('routes.safetyNotice')}
        </p>
      </div>
    </>
  )
}

function CollapseButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      aria-label={t('routes.collapsePanel')}
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
