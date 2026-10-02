import { useEffect, useRef, type ReactNode } from 'react'
import { Bike, Flag, Gauge, MapPin, Route, X } from 'lucide-react'
import type { BikeRoute } from '../data/mockRoutes'

interface RouteDrawerProps {
  route: BikeRoute
  onClose: () => void
}

export function RouteDrawer({ route, onClose }: RouteDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close route details"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-[2px]"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-labelledby="route-drawer-title"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-[calc(100%-1rem)] max-w-md flex-col overflow-y-auto bg-[#fbfbf8] shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-stone-200 px-5 py-5 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
              <Bike aria-hidden="true" size={18} />
              Route details
            </span>
            <button
              ref={closeButtonRef}
              aria-label="Close route details"
              className="flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-600 transition hover:border-stone-300 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={onClose}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-8 sm:px-7">
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {route.cities.map((city) => (
                <span
                  key={city}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                >
                  {city}
                </span>
              ))}
            </div>
            <h2
              id="route-drawer-title"
              className="text-3xl font-bold tracking-[-0.04em] text-slate-950"
            >
              {route.title}
            </h2>
            <p className="mt-4 leading-7 text-slate-600">{route.description}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <DetailStat
              icon={<Route aria-hidden="true" size={19} />}
              label="Distance"
              value={`${route.distanceKm} km`}
            />
            <DetailStat
              icon={<Gauge aria-hidden="true" size={19} />}
              label="Dedicated path"
              value={`${route.continuityScore}%`}
            />
            <DetailStat
              icon={<Bike aria-hidden="true" size={19} />}
              label="Difficulty"
              value={route.difficulty}
            />
            <DetailStat
              icon={<MapPin aria-hidden="true" size={19} />}
              label="Cities"
              value={`${route.cities.length}`}
            />
          </dl>

          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="relative space-y-6 before:absolute before:bottom-5 before:left-[9px] before:top-5 before:w-px before:bg-stone-200">
              <LocationRow
                icon={<MapPin aria-hidden="true" size={18} />}
                label="Start"
                value={route.startPoint}
              />
              <LocationRow
                icon={<Flag aria-hidden="true" size={18} />}
                label="Finish"
                value={route.endPoint}
              />
            </div>
          </div>
        </div>

        <p className="border-t border-stone-200 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-7">
          Route details are illustrative mock data and are not official navigation
          guidance.
        </p>
      </aside>
    </div>
  )
}

interface DetailStatProps {
  icon: ReactNode
  label: string
  value: string
}

function DetailStat({ icon, label, value }: DetailStatProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="mb-3 text-emerald-700">{icon}</div>
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-slate-900">{value}</dd>
    </div>
  )
}

interface LocationRowProps {
  icon: ReactNode
  label: string
  value: string
}

function LocationRow({ icon, label, value }: LocationRowProps) {
  return (
    <div className="relative flex gap-4">
      <span className="z-10 flex size-5 items-center justify-center bg-white text-emerald-700">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}
