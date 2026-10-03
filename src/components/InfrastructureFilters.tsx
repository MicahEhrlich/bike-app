import { Layers3 } from 'lucide-react'
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
  return (
    <div className="absolute left-3 right-3 top-20 z-[1200] overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-lg backdrop-blur sm:bottom-8 sm:right-auto sm:top-auto sm:w-64">
      <div className="hidden items-center gap-2 border-b border-stone-200 px-4 py-3 sm:flex">
        <Layers3 aria-hidden="true" className="text-emerald-700" size={17} />
        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-slate-600">
          Map layers
        </p>
      </div>
      <div
        aria-label="Filter infrastructure types"
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
                  ? 'border-stone-200 bg-white text-slate-800 shadow-sm sm:bg-stone-50 sm:shadow-none'
                  : 'border-stone-200 bg-stone-100 text-slate-400 opacity-70'
              }`}
              type="button"
              onClick={() => onToggle(type)}
            >
              <FilterSwatch
                color={meta.color}
                dashed={meta.dashed}
                dot={meta.dot}
              />
              <span>{meta.label}</span>
              <span className="ml-auto text-[10px] tabular-nums text-slate-400">
                {counts[type].toLocaleString()}
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
