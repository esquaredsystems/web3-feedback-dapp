import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { RatingSection } from '../lib/questions'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// Colour for each rating value 1..5 (red → green)
const VALUE_STYLES = [
  'bg-rose-500 border-rose-400 shadow-rose-500/30',
  'bg-orange-500 border-orange-400 shadow-orange-500/30',
  'bg-amber-400 border-amber-300 shadow-amber-400/30 text-ink-950',
  'bg-lime-400 border-lime-300 shadow-lime-400/30 text-ink-950',
  'bg-emerald-400 border-emerald-300 shadow-emerald-400/30 text-ink-950',
]

export function SectionCard({
  id,
  number,
  title,
  subtitle,
  complete,
  children,
}: {
  id: string
  number: number | string
  title: string
  subtitle?: string
  complete?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className="glass scroll-mt-28 p-5 sm:p-7 animate-fade-up">
      <header className="mb-5 flex items-start gap-4">
        <span
          className={cx(
            'grid h-10 min-w-10 shrink-0 place-items-center whitespace-nowrap rounded-2xl border px-2.5 font-display text-sm font-semibold transition',
            complete
              ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
              : 'border-violet-400/30 bg-violet-500/10 text-violet-300',
          )}
        >
          {complete ? <Check className="size-5" /> : number}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export function FieldLabel({
  htmlFor,
  children,
  optional,
  error,
}: {
  htmlFor?: string
  children: ReactNode
  optional?: boolean
  error?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
      {children}
      {optional ? (
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-normal text-zinc-500">optional</span>
      ) : (
        error && <span className="text-xs font-normal text-rose-400">required</span>
      )}
    </label>
  )
}

/** Pill-style single choice (radio group). */
export function ChoiceGroup<T extends string | number>({
  id,
  label,
  options,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T | null
  onChange: (v: T) => void
  error?: boolean
}) {
  return (
    <div id={id} className="scroll-mt-32">
      <FieldLabel error={error}>{label}</FieldLabel>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cx(
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30',
                active
                  ? 'border-violet-400/70 bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-white shadow-lg shadow-violet-500/10'
                  : error
                    ? 'border-rose-500/40 bg-rose-500/5 text-zinc-300 hover:border-rose-400/60'
                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/25 hover:bg-white/[0.06]',
              )}
            >
              {o.icon}
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** A block of 1..5 rating rows sharing the same scale. */
export function RatingMatrix({
  section,
  offset,
  values,
  onChange,
  showErrors,
}: {
  section: RatingSection
  offset: number
  values: (number | null)[]
  onChange: (index: number, value: number) => void
  showErrors: boolean
}) {
  const { scale, items } = section
  return (
    <div className="-mx-2">
      {/* Column headers (desktop) */}
      <div className="hidden items-end gap-4 px-2 pb-2 md:flex">
        <div className="flex-1" />
        <div className="grid w-[26rem] shrink-0 grid-cols-5 gap-2">
          {scale.map((s, i) => (
            <div key={s} className="text-center text-[11px] leading-tight font-medium text-zinc-500">
              <span className="block font-display text-xs text-zinc-400">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {items.map((item, i) => {
          const idx = offset + i
          const v = values[idx]
          const missing = showErrors && v == null
          return (
            <div
              key={item}
              id={`rating-${idx}`}
              role="radiogroup"
              aria-label={item}
              className={cx(
                'flex scroll-mt-32 flex-col gap-3 rounded-2xl px-2 py-3.5 transition md:flex-row md:items-center md:gap-4',
                missing && 'bg-rose-500/[0.06]',
              )}
            >
              <div className="flex flex-1 items-baseline gap-3 text-[15px] text-zinc-200">
                {items.length > 1 && (
                  <span className="w-5 shrink-0 text-right font-display text-xs text-zinc-500">{i + 1}.</span>
                )}
                <span className="flex-1">{item}</span>
                {missing && <span className="text-xs text-rose-400 md:hidden">required</span>}
              </div>
              <div className="grid w-full shrink-0 grid-cols-5 gap-2 md:w-[26rem]">
                {scale.map((label, j) => {
                  const value = j + 1
                  const active = v === value
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${value} – ${label}`}
                      title={label}
                      onClick={() => onChange(idx, value)}
                      className={cx(
                        'group flex min-h-12 flex-col items-center justify-center rounded-xl border px-0.5 py-1.5 text-sm font-semibold transition md:h-11 md:min-h-0 md:py-0',
                        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30',
                        active
                          ? cx(VALUE_STYLES[j], 'scale-[1.04] text-white shadow-lg')
                          : missing
                            ? 'border-rose-500/30 bg-ink-900/60 text-zinc-400 hover:border-rose-400/60'
                            : 'border-white/[0.08] bg-ink-900/60 text-zinc-400 hover:border-white/25 hover:bg-white/[0.06] hover:text-white',
                      )}
                    >
                      <span className="font-display">{value}</span>
                      <span className="mt-0.5 max-w-full text-[9px] leading-[1.15] font-medium break-words opacity-80 md:hidden">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const bytes = new TextEncoder().encode(value).length
  return (
    <span className={cx('text-xs tabular-nums', bytes > max ? 'text-rose-400' : 'text-zinc-500')}>
      {bytes}/{max}
    </span>
  )
}
