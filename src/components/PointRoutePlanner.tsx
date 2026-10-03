import { useEffect, useState } from 'react'
import { Flag, MapPin, RotateCcw, Route as RouteIcon, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatNumber, getSupportedLanguage, translateDifficulty } from '../utils/localization'

import { estimateRouteDifficulty, type SavedBikeRoute } from '../utils/savedRoutes'

export type PointRoutePlanningStage = 'inactive' | 'start' | 'end' | 'complete'

interface PointRoutePlannerProps {
  stage: PointRoutePlanningStage
  distanceKm: number | null
  errorKey: string | null
  hasViaPoint: boolean
  savedRoutes: SavedBikeRoute[]
  storageErrorKey: string | null
  isSaved: boolean
  isPreviewing: boolean
  onSave: (name: string) => void
  onOpenSaved: (route: SavedBikeRoute) => void
  onDeleteSaved: (id: string) => void
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
  savedRoutes,
  storageErrorKey,
  isSaved,
  isPreviewing,
  onSave,
  onOpenSaved,
  onDeleteSaved,
  onActivate,
  onCancel,
  onStartOver,
  onChangeDestination,
  onRemoveViaPoint,
}: PointRoutePlannerProps) {
  const [routeName, setRouteName] = useState('')
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

  const savedList = (
    <>
      {storageErrorKey && <p role="alert" className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300">{t(storageErrorKey)}</p>}
      {savedRoutes.length > 0 && (
        <details className="mt-2 text-start text-sm text-slate-900 dark:text-white">
          <summary className="cursor-pointer font-bold">{t('pointRoute.savedRoutes', { count: savedRoutes.length })}</summary>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {savedRoutes.map((saved) => (
              <li key={saved.id} className="flex items-center gap-2 rounded-lg bg-stone-100 p-2 dark:bg-slate-800">
                <button type="button" className="min-w-0 flex-1 text-start focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => onOpenSaved(saved)}>
                  <span className="block truncate font-bold">{saved.name}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {t('units.kilometers', { value: formatNumber(saved.route.distanceKm, language, 2) })} · {translateDifficulty(estimateRouteDifficulty(saved.route.distanceKm), t)}
                  </span>
                </button>
                <button type="button" aria-label={t('pointRoute.deleteSaved', { name: saved.name })} className="rounded-lg p-2 text-slate-500 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => onDeleteSaved(saved.id)}>
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )

  if (stage === 'inactive') {
    return (
      <>
      <button
        className="absolute left-1/2 top-3 z-[1200] inline-flex h-10 -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-extrabold text-white shadow-xl transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-emerald-700 dark:hover:bg-emerald-600"
        type="button"
        onClick={onActivate}
      >
        <RouteIcon aria-hidden="true" size={18} />
        <span className="hidden sm:inline">{t('pointRoute.planRoute')}</span>
      </button>
      {(savedRoutes.length > 0 || storageErrorKey) && (
        <section aria-label={t('pointRoute.savedRoutesLabel')} className="absolute left-3 right-3 top-16 z-[1200] rounded-2xl bg-white/97 p-3 shadow-xl dark:bg-slate-900/97 sm:left-1/2 sm:right-auto sm:w-[27rem] sm:-translate-x-1/2">
          {savedList}
        </section>
      )}
      </>
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
              value: formatNumber(distanceKm ?? 0, language, 2),
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
      {isComplete && distanceKm !== null && (
        <div className="mt-2 text-start">
          <p aria-live="polite" className="text-sm font-bold text-slate-900 dark:text-white">
            {t('pointRoute.difficultyEstimate', { difficulty: translateDifficulty(estimateRouteDifficulty(distanceKm), t) })}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('pointRoute.difficultyBasis')}</p>
          <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); onSave(routeName) }}>
            <input aria-label={t('pointRoute.routeName')} placeholder={t('pointRoute.routeName')} value={routeName} onChange={(event) => setRouteName(event.target.value)} maxLength={100} className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <button type="submit" disabled={isSaved || isPreviewing} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{t(isSaved ? 'pointRoute.saved' : 'pointRoute.saveRoute')}</button>
          </form>
        </div>
      )}
      {savedList}
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
