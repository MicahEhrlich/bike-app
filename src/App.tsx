import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Languages,
  Moon,
  RefreshCw,
  Settings2,
  Sun,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { BasketBikeLogo } from './components/BasketBikeLogo'
import { BikeMap } from './components/BikeMap'
import { OnboardingWizard } from './components/OnboardingWizard'
import type { BikeRoute } from './data/routes'
import { LANGUAGE_STORAGE_KEY } from './i18n'
import {
  loadBikeData,
  type BikePathCollection,
} from './utils/loadBikeData'
import { formatNumber, getSupportedLanguage } from './utils/localization'
import {
  DEFAULT_ROUTE_FILTERS,
  type RouteFiltersState,
} from './utils/routeFilters'
import {
  applyProfileToFilters,
  EMPTY_RIDER_PROFILE,
  loadStoredRiderProfile,
  saveRiderProfile,
  type RiderProfile,
} from './utils/riderProfile'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: BikePathCollection }
  | { status: 'error' }

type Theme = 'light' | 'dark'

function getMapFeatureCounts(data: BikePathCollection) {
  return data.features.reduce(
    (counts, feature) => {
      const properties = feature.properties ?? {}

      if (['LineString', 'MultiLineString'].includes(feature.geometry.type)) {
        counts.paths += 1
      }

      if (
        feature.geometry.type === 'Point' &&
        (properties.amenity === 'drinking_water' ||
          properties.man_made === 'water_tap' ||
          properties.drinking_water === 'yes')
      ) {
        counts.fountains += 1
      }

      if (
        feature.geometry.type === 'Point' &&
        properties.amenity === 'toilets'
      ) {
        counts.restrooms += 1
      }

      return counts
    },
    { paths: 0, fountains: 0, restrooms: 0 },
  )
}

function App() {
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [selectedRoute, setSelectedRoute] = useState<BikeRoute | null>(null)
  const [isRoutesPanelCollapsed, setIsRoutesPanelCollapsed] = useState(false)
  const [storedProfile] = useState(() => loadStoredRiderProfile())
  const [riderProfile, setRiderProfile] = useState<RiderProfile>(
    storedProfile?.profile ?? EMPTY_RIDER_PROFILE,
  )
  const [routeFilters, setRouteFilters] = useState<RouteFiltersState>(() =>
    storedProfile
      ? applyProfileToFilters(storedProfile.profile, DEFAULT_ROUTE_FILTERS)
      : DEFAULT_ROUTE_FILTERS,
  )
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!storedProfile)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    loadBikeData(controller.signal)
      .then((data) => setLoadState({ status: 'ready', data }))
      .catch(() => {
        if (controller.signal.aborted) return

        setLoadState({ status: 'error' })
      })

    return () => controller.abort()
  }, [loadAttempt])

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem('metrobike-theme', theme)
    } catch {
      // The theme still works when storage is unavailable.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#020617' : '#064e3b')
  }, [theme])

  useEffect(() => {
    const direction = language === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    document.documentElement.dir = direction
    document.title = t('app.documentTitle')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('app.documentDescription'))

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // The language still works when storage is unavailable.
    }
  }, [language, t])

  const retryLoad = () => {
    setLoadState({ status: 'loading' })
    setSelectedRoute(null)
    setLoadAttempt((attempt) => attempt + 1)
  }

  const mapCounts =
    loadState.status === 'ready' ? getMapFeatureCounts(loadState.data) : null
  const selectRoute = (route: BikeRoute) => {
    setSelectedRoute(route)
    setIsRoutesPanelCollapsed(false)
  }
  const completeOnboarding = useCallback((profile: RiderProfile) => {
    const savedProfile = saveRiderProfile(profile)
    setRiderProfile(savedProfile)
    setRouteFilters((current) => applyProfileToFilters(savedProfile, current))
    setIsOnboardingOpen(false)
    setIsEditingProfile(false)
  }, [])
  const skipOnboarding = useCallback(() => {
    const savedProfile = saveRiderProfile(EMPTY_RIDER_PROFILE)
    setRiderProfile(savedProfile)
    setRouteFilters((current) => applyProfileToFilters(savedProfile, current))
    setIsOnboardingOpen(false)
    setIsEditingProfile(false)
  }, [])
  const cancelProfileEditing = useCallback(() => {
    setIsOnboardingOpen(false)
    setIsEditingProfile(false)
  }, [])
  const openProfileEditor = () => {
    setIsEditingProfile(true)
    setIsOnboardingOpen(true)
  }
  const riderName = riderProfile.name || t('app.guest')

  return (
    <div
      className="flex h-svh min-h-[36rem] flex-col overflow-hidden bg-[#f7f7f3] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <header className="relative z-[2000] shrink-0 border-b border-stone-200 bg-[#f7f7f3]/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-sm">
              <BasketBikeLogo size={30} />
            </span>
            <div className="min-w-0 text-start">
              <h1 className="truncate text-lg font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-xl">
                {t('app.brand')}
              </h1>
              <button
                aria-label={t('app.editPreferences')}
                className="group block max-w-full truncate text-start text-sm text-slate-500 transition hover:text-emerald-800 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
                title={t('app.editPreferences')}
                type="button"
                onClick={openProfileEditor}
              >
                <Trans
                  components={{
                    name: (
                      <bdi className="font-bold text-slate-700 group-hover:text-emerald-800 dark:text-slate-200 dark:group-hover:text-emerald-300" />
                    ),
                  }}
                  i18nKey="app.greeting"
                  values={{ name: riderName }}
                />
                <span className="hidden sm:inline"> · {t('app.subtitle')}</span>
                <Settings2 aria-hidden="true" className="ms-1 inline" size={12} />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {mapCounts && (
              <p
                aria-live="polite"
                className="hidden rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:block sm:text-sm"
              >
                <span>
                  {t('app.pathsCount', {
                    count: formatNumber(mapCounts.paths, language, 0),
                  })}
                </span>
                <span className="hidden sm:inline">
                  {' '}·{' '}
                  {t('app.waterCount', {
                    count: formatNumber(mapCounts.fountains, language, 0),
                  })}{' '}
                  ·{' '}
                  {t('app.restroomsCount', {
                    count: formatNumber(mapCounts.restrooms, language, 0),
                  })}
                </span>
              </p>
            )}
            <button
              aria-label={t('app.switchLanguageLabel')}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
              type="button"
              onClick={() => void i18n.changeLanguage(language === 'he' ? 'en' : 'he')}
            >
              <Languages aria-hidden="true" size={15} />
              {t('app.switchLanguage')}
            </button>
            <button
              aria-label={t('app.switchTheme', {
                theme: t(`app.${theme === 'dark' ? 'light' : 'dark'}`),
              })}
              aria-pressed={theme === 'dark'}
              className="flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
              title={t('app.switchTheme', {
                theme: t(`app.${theme === 'dark' ? 'light' : 'dark'}`),
              })}
              type="button"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative isolate z-0 flex min-h-0 flex-1">
        {loadState.status === 'loading' && <LoadingState />}
        {loadState.status === 'error' && (
          <ErrorState onRetry={retryLoad} />
        )}
        {loadState.status === 'ready' && (
          <BikeMap
            data={loadState.data}
            isRoutesPanelCollapsed={isRoutesPanelCollapsed}
            routeFilters={routeFilters}
            selectedRoute={selectedRoute}
            onClearRoute={() => setSelectedRoute(null)}
            onSelectRoute={selectRoute}
            onRouteFiltersChange={setRouteFilters}
            onToggleRoutesPanel={() =>
              setIsRoutesPanelCollapsed((isCollapsed) => !isCollapsed)
            }
          />
        )}
      </main>
      {isOnboardingOpen && (
        <OnboardingWizard
          initialProfile={riderProfile}
          isEditing={isEditingProfile}
          onCancel={cancelProfileEditing}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  )
}

function LoadingState() {
  const { t } = useTranslation()
  return (
    <div
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      role="status"
    >
      <span className="size-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
      <div>
        <p className="font-bold text-slate-900 dark:text-white">
          {t('app.loadingTitle')}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('app.loadingBody')}
        </p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  onRetry: () => void
}

function ErrorState({ onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-sm dark:border-amber-900 dark:bg-slate-900">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle aria-hidden="true" size={23} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
          {t('app.errorTitle')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('app.unknownError')}
        </p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={16} />
          {t('app.retry')}
        </button>
      </div>
    </div>
  )
}

export default App
