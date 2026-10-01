import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, Search } from 'lucide-react'
import { RATING_SECTIONS, REASON_OPTIONS, RECOMMEND_OPTIONS, SECTION_OFFSETS } from '../../lib/questions'
import { explorerAddress } from '../../lib/wagmi'
import { cx } from '../ui'
import { Empty } from './Overview'
import { average, fmt, fmtDate, shortAddr, type Course, type Feedback } from './types'

type Row = Feedback & { id: number }

export function Responses({ feedbacks, courses }: { feedbacks: Row[]; courses: Course[] }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<number | null>(null)

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...feedbacks]
      .reverse() // newest first
      .filter(
        (f) =>
          !needle ||
          [f.name, f.submitter, f.mostUseful, f.improvements, f.complaints].some((t) => t.toLowerCase().includes(needle)),
      )
  }, [feedbacks, q])

  if (!feedbacks.length) return <Empty />

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="field pl-11"
          placeholder="Search names, wallet addresses or written answers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <p className="px-1 text-xs text-zinc-500">
        {rows.length} of {feedbacks.length} responses · newest first
      </p>

      <ul className="space-y-3">
        {rows.map((f) => {
          const isOpen = open === f.id
          const avg = average([...f.ratings].map(Number))
          return (
            <li key={f.id} className="glass overflow-hidden rounded-2xl">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : f.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-white/[0.03] sm:p-5"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.05] font-display text-sm font-semibold text-white tabular-nums">
                  {fmt(avg)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-white">
                    {f.name.trim() || <span className="text-zinc-400 italic">Anonymous</span>}
                    {f.complaints.trim() && (
                      <span className="ml-2 rounded-full bg-amber-400/10 px-2 py-0.5 align-middle text-[11px] font-medium text-amber-300 not-italic">
                        has complaint
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">
                    #{f.id} · {shortAddr(f.submitter)} · {fmtDate(f.timestamp)}
                    {courses.length > 1 && ` · ${courses.find((c) => c.id === f.courseId)?.name ?? ''}`}
                  </span>
                </span>
                <ChevronDown className={cx('size-5 shrink-0 text-zinc-500 transition', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="space-y-6 border-t border-white/[0.06] p-4 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Fact label="Why they chose it" value={REASON_OPTIONS[f.reason] ?? '–'} />
                    <Fact label="Would recommend" value={RECOMMEND_OPTIONS[f.recommend] ?? '–'} />
                    <Fact label="Would pay" value={f.wouldPay ? 'Yes' : 'No'} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <Text label="9. Most useful or valuable" value={f.mostUseful} />
                    <Text label="10. How to improve" value={f.improvements} />
                    <Text label="11. Complaints" value={f.complaints} highlight />
                  </div>

                  <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
                    {RATING_SECTIONS.map((s, si) => (
                      <div key={s.id}>
                        <div className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">{s.title}</div>
                        <ul className="space-y-1">
                          {s.items.map((item, i) => {
                            const v = Number(f.ratings[SECTION_OFFSETS[si] + i])
                            return (
                              <li key={item} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-zinc-300">{item}</span>
                                <span className="shrink-0 text-xs text-zinc-500">
                                  {s.scale[v - 1]}{' '}
                                  <span className="ml-1 inline-block w-4 text-right font-display text-sm font-semibold text-white">
                                    {v}
                                  </span>
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <a
                    href={explorerAddress(f.submitter)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Wallet {f.submitter} <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 font-medium text-white">{value}</div>
    </div>
  )
}

function Text({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const empty = !value.trim()
  return (
    <div
      className={cx(
        'rounded-xl border px-4 py-3',
        highlight && !empty ? 'border-amber-400/25 bg-amber-400/[0.05]' : 'border-white/[0.06] bg-white/[0.02]',
      )}
    >
      <div className="text-xs text-zinc-500">{label}</div>
      <p className={cx('mt-1 text-sm whitespace-pre-wrap', empty ? 'text-zinc-600 italic' : 'text-zinc-200')}>
        {empty ? 'No answer' : value}
      </p>
    </div>
  )
}
