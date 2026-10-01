import { useMemo } from 'react'
import { RATING_SECTIONS, REASON_OPTIONS, RECOMMEND_OPTIONS, SECTION_OFFSETS } from '../../lib/questions'
import { average, fmt, pct, type Feedback } from './types'

// Chart colours (validated categorical slots 1–3 for dark surfaces; single hue for averages)
const BAR = '#3987e5'
const SERIES = ['#3987e5', '#d95926', '#199e70']

export function Overview({ feedbacks }: { feedbacks: Feedback[] }) {
  const n = feedbacks.length

  const stats = useMemo(() => {
    const all = feedbacks.flatMap((f) => [...f.ratings].map(Number))
    return {
      overall: average(all),
      recommendYes: feedbacks.filter((f) => f.recommend === 0).length,
      wouldPay: feedbacks.filter((f) => f.wouldPay).length,
      named: feedbacks.filter((f) => f.name.trim()).length,
    }
  }, [feedbacks])

  if (!n) return <Empty />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Responses" value={String(n)} sub={`${stats.named} named · ${n - stats.named} anonymous`} />
        <Tile label="Overall average" value={fmt(stats.overall)} unit="/ 5" sub="across all 30 rated items" />
        <Tile label="Would recommend" value={`${pct(stats.recommendYes, n)}%`} sub={`${stats.recommendYes} of ${n} said Yes`} />
        <Tile label="Would pay to attend" value={`${pct(stats.wouldPay, n)}%`} sub={`${stats.wouldPay} of ${n} said Yes`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {RATING_SECTIONS.map((s, si) => {
          const off = SECTION_OFFSETS[si]
          const items = s.items.map((label, i) => {
            const vals = feedbacks.map((f) => Number(f.ratings[off + i]))
            const dist = [1, 2, 3, 4, 5].map((v) => vals.filter((x) => x === v).length)
            return { label, avg: average(vals), dist }
          })
          const sectionAvg = average(items.map((i) => i.avg))
          return (
            <section key={s.id} className="glass rounded-2xl p-5">
              <header className="mb-4 flex items-baseline justify-between gap-3">
                <h3 className="font-display font-semibold text-white">
                  <span className="mr-2 text-zinc-500">{s.number}.</span>
                  {s.title}
                </h3>
                <span className="text-sm text-zinc-400">
                  avg <span className="font-display text-base font-semibold text-white tabular-nums">{fmt(sectionAvg)}</span>
                </span>
              </header>
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li
                    key={it.label}
                    className="group grid grid-cols-[minmax(0,1fr)_7rem_2.25rem] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_2.25rem]"
                    title={`${it.label}\n${it.dist.map((c, i) => `${i + 1} (${s.scale[i]}): ${c}`).join('\n')}`}
                  >
                    <span className="text-sm leading-snug text-zinc-300 group-hover:text-white">{it.label}</span>
                    <span className="relative h-2.5 rounded-full bg-white/[0.06]">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${(it.avg / 5) * 100}%`, background: BAR }}
                      />
                    </span>
                    <span className="text-right font-display text-sm font-semibold text-zinc-200 tabular-nums">{fmt(it.avg)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-zinc-500">
                Scale: 1 {s.scale[0]} → 5 {s.scale[4]}. Hover a row to see how many people chose each score.
              </p>
            </section>
          )
        })}
      </div>

      <section className="glass rounded-2xl p-5">
        <h3 className="mb-5 font-display font-semibold text-white">Choices</h3>
        <div className="space-y-6">
          <Breakdown
            title="12. Why did you choose this workshop/course?"
            labels={[...REASON_OPTIONS]}
            counts={REASON_OPTIONS.map((_, i) => feedbacks.filter((f) => f.reason === i).length)}
          />
          <Breakdown
            title="13. Would you recommend it to others?"
            labels={[...RECOMMEND_OPTIONS]}
            counts={RECOMMEND_OPTIONS.map((_, i) => feedbacks.filter((f) => f.recommend === i).length)}
          />
          <Breakdown
            title="14. Would you have paid to attend?"
            labels={['Yes', 'No']}
            counts={[stats.wouldPay, n - stats.wouldPay]}
          />
        </div>
      </section>
    </div>
  )
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className="mt-1.5 font-display text-3xl font-semibold text-white tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-zinc-500">{unit}</span>}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  )
}

/** 100% stacked bar with legend (identity never carried by colour alone). */
function Breakdown({ title, labels, counts }: { title: string; labels: string[]; counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0)
  return (
    <div>
      <div className="mb-2 text-sm text-zinc-300">{title}</div>
      <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-full bg-white/[0.06]">
        {counts.map((c, i) =>
          c ? (
            <span
              key={labels[i]}
              title={`${labels[i]}: ${c} (${pct(c, total)}%)`}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(c / total) * 100}%`, background: SERIES[i] }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-400">
        {labels.map((l, i) => (
          <li key={l} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: SERIES[i] }} />
            {l} <span className="font-semibold text-zinc-200 tabular-nums">{pct(counts[i], total)}%</span>
            <span className="text-zinc-500">({counts[i]})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Empty() {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="font-display text-lg font-semibold text-white">No feedback yet</div>
      <p className="mt-1 text-sm text-zinc-400">Responses will appear here as soon as participants submit them.</p>
    </div>
  )
}
