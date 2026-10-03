import { Layers3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSupportedLanguage, formatNumber } from '../utils/localization'
import {
  ALL_INFRASTRUCTURE_TYPES,
  INFRASTRUCTURE_META,
  type InfrastructureType,
} from '../utils/infrastructure'

interface InfrastructureFiltersProps {
  activeTypes: InfrastructureType[]
  counts: Record<InfrastructureType, number>
  onToggle: (type: InfrastructureType) => void
}

export function InfrastructureFilters({
  activeTypes,
  counts,
  onToggle,
}: InfrastructureFiltersProps) {
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const labelKeys: Record<InfrastructureType, string> = {
    dedicated: 'layers.dedicated',
    'on-road': 'layers.onRoad',
    other: 'layers.other',
    fountain: 'layers.fountain',
    restroom: 'layers.restroom',
  }

  return (
    <div className="absolute left-3 right-3 top-20 z-[1200] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/95 sm:bottom-8 sm:right-auto sm:top-auto sm:w-64">
      <div className="hidden items-center gap-2 border-b border-stone-200 px-4 py-3 dark:border-slate-700 sm:flex">
        <Layers3 aria-hidden="true" className="text-emerald-700 dark:text-emerald-400" size={17} />
        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-600 dark:text-slate-300">
          {t('layers.title')}
        </p>
      </div>
      <div
        aria-label={t('layers.filterLabel')}
        className="flex gap-2 overflow-x-auto p-2 sm:block sm:space-y-1 sm:overflow-visible"
        role="group"
      >
        {ALL_INFRASTRUCTURE_TYPES.map((type) => {
          const meta = INFRASTRUCTURE_META[type]
          const isActive = activeTypes.includes(type)

          return (
            <button
              key={type}
              aria-pressed={isActive}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:w-full sm:border-transparent ${
                isActive
                  ? 'border-stone-200 bg-white text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:bg-stone-50 sm:shadow-none sm:dark:bg-slate-800'
                  : 'border-stone-200 bg-stone-100 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-500'
              }`}
              type="button"
              onClick={() => onToggle(type)}
            >
              <FilterSwatch
                color={meta.color}
                dashed={meta.dashed}
                dot={meta.dot}
              />
              <span>{t(labelKeys[type])}</span>
              <span className="ms-auto text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                {formatNumber(counts[type], language, 0)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FilterSwatch({
  color,
  dashed = false,
  dot = false,
}: {
  color: string
  dashed?: boolean
  dot?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={
        dot
          ? 'block size-3 rounded-full border-2 border-white shadow-sm'
          : 'block w-6 border-t-[3px]'
      }
      style={
        dot
          ? { backgroundColor: color }
          : { borderColor: color, borderStyle: dashed ? 'dashed' : 'solid' }
      }
    />
  )
}
