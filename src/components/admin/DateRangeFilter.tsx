import { CalendarRange, X } from 'lucide-react'
import { cx } from '../ui'

/** Inclusive date range in the viewer's local time. Empty string = unbounded. Values are `YYYY-MM-DD`. */
export interface DateRange {
  from: string
  to: string
}

export const ALL_TIME: DateRange = { from: '', to: '' }

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}

/** Unix-second bounds for a range: start of `from` day through the very end of `to` day (local time). */
export function rangeBounds({ from, to }: DateRange): { min: bigint | null; max: bigint | null } {
  const min = from ? BigInt(Math.floor(new Date(`${from}T00:00:00`).getTime() / 1000)) : null
  const max = to ? BigInt(Math.floor(new Date(`${to}T23:59:59`).getTime() / 1000)) : null
  return { min, max }
}

export const isFiltered = (r: DateRange) => !!(r.from || r.to)

const PRESETS: { label: string; get: () => DateRange }[] = [
  { label: 'All time', get: () => ALL_TIME },
  { label: 'Today', get: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { label: 'Last 7 days', get: () => ({ from: daysAgo(6), to: iso(new Date()) }) },
  { label: 'Last 30 days', get: () => ({ from: daysAgo(29), to: iso(new Date()) }) },
]

export function DateRangeFilter({
  value,
  onChange,
  shown,
  total,
}: {
  value: DateRange
  onChange: (r: DateRange) => void
  shown: number
  total: number
}) {
  const invalid = !!value.from && !!value.to && value.from > value.to
  const active = (p: { get: () => DateRange }) => {
    const r = p.get()
    return r.from === value.from && r.to === value.to
  }

  return (
    <div className="glass mb-6 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2 px-1 text-sm font-medium text-zinc-300">
        <CalendarRange className="size-4 text-zinc-400" /> Date range
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="range-from">
          From date
        </label>
        <input
          id="range-from"
          type="date"
          className={cx('field h-10 w-auto py-0 text-sm', invalid && 'border-rose-400/60')}
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
        <span className="text-zinc-500">to</span>
        <label className="sr-only" htmlFor="range-to">
          To date
        </label>
        <input
          id="range-to"
          type="date"
          className={cx('field h-10 w-auto py-0 text-sm', invalid && 'border-rose-400/60')}
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.get())}
            className={cx(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              active(p) ? 'bg-white/[0.12] text-white' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            {p.label}
          </button>
        ))}
        {isFiltered(value) && (
          <button
            type="button"
            onClick={() => onChange(ALL_TIME)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
            aria-label="Clear date range"
          >
            <X className="size-3.5" /> Clear
          </button>
        )}
      </div>

      <div className={cx('text-xs sm:ml-auto sm:pr-2', invalid ? 'text-rose-300' : 'text-zinc-400')}>
        {invalid ? '"From" is after "To".' : `${shown} of ${total} responses in range`}
      </div>
    </div>
  )
}
