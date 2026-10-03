import { useEffect, useState } from 'react'
import { AlertTriangle, Bike, RefreshCw } from 'lucide-react'
import { BikeMap } from './components/BikeMap'
import type { BikeRoute } from './data/routes'
import {
  loadBikeData,
  type BikePathCollection,
} from './utils/loadBikeData'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; data: BikePathCollection }
  | { status: 'error'; message: string }

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
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [selectedRoute, setSelectedRoute] = useState<BikeRoute | null>(null)
  const [isRoutesPanelCollapsed, setIsRoutesPanelCollapsed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    loadBikeData(controller.signal)
      .then((data) => setLoadState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setLoadState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while loading the map data.',
        })
      })

    return () => controller.abort()
  }, [loadAttempt])

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

  return (
    <div className="flex h-svh min-h-[36rem] flex-col overflow-hidden bg-[#f7f7f3] text-slate-900">
      <header className="relative z-[2000] shrink-0 border-b border-stone-200 bg-[#f7f7f3]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900 text-white shadow-sm">
              <Bike aria-hidden="true" size={22} strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-[-0.035em] text-slate-950 sm:text-xl">
                MetroBike TLV
              </h1>
              <p className="hidden text-sm text-slate-500 sm:block">
                Bike infrastructure across the Dan region
              </p>
            </div>
          </div>

          {mapCounts && (
            <p
              aria-live="polite"
              className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm sm:text-sm"
            >
              <span>{mapCounts.paths.toLocaleString()} paths</span>
              <span className="hidden sm:inline">
                {' '}· {mapCounts.fountains.toLocaleString()} water ·{' '}
                {mapCounts.restrooms.toLocaleString()} restrooms
              </span>
            </p>
          )}
        </div>
      </header>

      <main className="relative isolate z-0 flex min-h-0 flex-1">
        {loadState.status === 'loading' && <LoadingState />}
        {loadState.status === 'error' && (
          <ErrorState
            message={loadState.message}
            onRetry={retryLoad}
          />
        )}
        {loadState.status === 'ready' && (
          <BikeMap
            data={loadState.data}
            isRoutesPanelCollapsed={isRoutesPanelCollapsed}
            selectedRoute={selectedRoute}
            onClearRoute={() => setSelectedRoute(null)}
            onSelectRoute={selectRoute}
            onToggleRoutesPanel={() =>
              setIsRoutesPanelCollapsed((isCollapsed) => !isCollapsed)
            }
          />
        )}
      </main>
    </div>
  )
}

function LoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      role="status"
    >
      <span className="size-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
      <div>
        <p className="font-bold text-slate-900">Loading bike infrastructure</p>
        <p className="mt-1 text-sm text-slate-500">
          Preparing the Dan region map…
        </p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle aria-hidden="true" size={23} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Map data could not be loaded
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          type="button"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" size={16} />
          Try again
        </button>
      </div>
    </div>
  )
}

export default App
