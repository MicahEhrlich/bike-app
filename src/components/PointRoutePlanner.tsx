import { useEffect } from 'react'
import { Flag, MapPin, RotateCcw, Route as RouteIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber, getSupportedLanguage } from '../utils/localization'

export type PointRoutePlanningStage = 'inactive' | 'start' | 'end' | 'complete'

interface PointRoutePlannerProps {
  stage: PointRoutePlanningStage
  distanceKm: number | null
  errorKey: string | null
  hasViaPoint: boolean
  onActivate: () => void
  onCancel: () => void
  onStartOver: () => void
  onChangeDestination: () => void
  onRemoveViaPoint: () => void
}

export function PointRoutePlanner({
  stage,
  distanceKm,
  errorKey,
  hasViaPoint,
  onActivate,
  onCancel,
  onStartOver,
  onChangeDestination,
  onRemoveViaPoint,
}: PointRoutePlannerProps) {
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)

  useEffect(() => {
    if (stage === 'inactive') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, stage])

  if (stage === 'inactive') {
    return (
      <button
        className="absolute left-1/2 top-3 z-[1200] inline-flex h-10 -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-extrabold text-white shadow-xl transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
        type="button"
        onClick={onActivate}
      >
        <RouteIcon aria-hidden="true" size={18} />
        <span className="hidden sm:inline">{t('pointRoute.planRoute')}</span>
      </button>
    )
  }

  const isComplete = stage === 'complete'
  const instruction =
    stage === 'start'
      ? t('pointRoute.chooseStart')
      : stage === 'end'
        ? t('pointRoute.chooseEnd')
        : t('pointRoute.routeReady', {
            distance: t('units.kilometers', {
              value: formatNumber(distanceKm ?? 0, language),
            }),
          })

  return (
    <section
      aria-label={t('pointRoute.plannerLabel')}
      className="absolute left-3 right-3 top-16 z-[1200] rounded-2xl border border-white/70 bg-white/97 p-3 shadow-xl backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/97 sm:left-1/2 sm:right-auto sm:w-[27rem] sm:-translate-x-1/2"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white ${
            stage === 'start'
              ? 'bg-emerald-700'
              : stage === 'end'
                ? 'bg-violet-700'
                : 'bg-slate-900 dark:bg-emerald-700'
          }`}
        >
          {stage === 'start' ? (
            <MapPin aria-hidden="true" size={18} />
          ) : stage === 'end' ? (
            <Flag aria-hidden="true" size={18} />
          ) : (
            <RouteIcon aria-hidden="true" size={18} />
          )}
        </span>
        <div className="min-w-0 flex-1 text-start">
          <p
            aria-live="polite"
            className="text-sm font-extrabold text-slate-900 dark:text-white"
          >
            {instruction}
          </p>
          {!isComplete && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t(stage === 'start' ? 'pointRoute.startSnapHelp' : errorKey ? 'pointRoute.retryDestinationHelp' : 'pointRoute.snapHelp')}
            </p>
          )}
          {isComplete && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('pointRoute.dragHelp')}
            </p>
          )}
        </div>
        {isComplete && (
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-slate-700 dark:text-slate-300"
            type="button"
            onClick={onStartOver}
          >
            <RotateCcw aria-hidden="true" size={14} />
            {t('pointRoute.startOver')}
          </button>
        )}
        <button
          aria-label={t('pointRoute.closePlanner')}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-stone-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-slate-800 dark:hover:text-white"
          type="button"
          onClick={onCancel}
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      {errorKey && (
        <p
          className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
          role="alert"
        >
          {t(errorKey)}
        </p>
      )}
      {(isComplete || (stage === 'end' && errorKey)) && (
        <button
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-slate-800"
          type="button"
          onClick={onChangeDestination}
        >
          <Flag aria-hidden="true" size={14} />
          {t('pointRoute.changeDestination')}
        </button>
      )}
      {isComplete && hasViaPoint && (
        <button
          className="mt-2 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
          type="button"
          onClick={onRemoveViaPoint}
        >
          {t('pointRoute.removeDetour')}
        </button>
      )}
    </section>
  )
}
