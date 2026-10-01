import { useEffect, useMemo, useState } from 'react'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  type ContractFunctionArgs,
} from 'viem'
import { AlertTriangle, Loader2, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { feedbackAbi } from '../contract/abi'
import { FEEDBACK_CONTRACT } from '../lib/wagmi'
import {
  DEFAULT_COURSES,
  MAX_NAME_BYTES,
  MAX_TEXT_BYTES,
  RATING_COUNT,
  RATING_SECTIONS,
  REASON_OPTIONS,
  RECOMMEND_OPTIONS,
  SECTION_OFFSETS,
  WOULD_PAY_OPTIONS,
} from '../lib/questions'
import { ChoiceGroup, CharCount, FieldLabel, RatingMatrix, SectionCard, cx } from './ui'
import { SubmittedCard } from './SubmittedCard'

type FeedbackInput = ContractFunctionArgs<typeof feedbackAbi, 'nonpayable', 'submitFeedback'>[0]

interface FormState {
  courseId: number | null
  name: string
  ratings: (number | null)[]
  mostUseful: string
  improvements: string
  complaints: string
  reason: number | null
  recommend: number | null
  wouldPay: boolean | null
}

const emptyState = (): FormState => ({
  courseId: null,
  name: '',
  ratings: Array(RATING_COUNT).fill(null),
  mostUseful: '',
  improvements: '',
  complaints: '',
  reason: null,
  recommend: null,
  wouldPay: null,
})

const bytes = (s: string) => new TextEncoder().encode(s).length
const draftKey = (addr?: string) => `feedback-draft:${addr?.toLowerCase() ?? 'preview'}`

function loadDraft(addr?: string): FormState {
  try {
    const raw = localStorage.getItem(draftKey(addr))
    if (raw) {
      const d = JSON.parse(raw) as FormState
      if (Array.isArray(d.ratings) && d.ratings.length === RATING_COUNT) return { ...emptyState(), ...d }
    }
  } catch {
    /* storage unavailable */
  }
  return emptyState()
}

function friendlyError(err: unknown): string {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) return 'You rejected the transaction in your wallet.'
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      switch (revert.data?.errorName) {
        case 'AlreadySubmitted':
          return 'This wallet has already submitted feedback for this course.'
        case 'CourseInactive':
          return 'This course is no longer accepting feedback.'
        case 'InvalidRating':
          return 'One of the ratings is invalid. Please review the form.'
        case 'TextTooLong':
          return 'One of your answers is too long. Please shorten it.'
        case 'InvalidCourse':
          return 'Please select a valid course.'
      }
    }
    if (/insufficient funds/i.test(err.message))
      return 'Not enough Sepolia ETH to pay for gas. Grab some from a faucet and try again.'
    return err.shortMessage || err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong.'
}

const TEXT_QUESTIONS = [
  { key: 'mostUseful', n: 9, label: 'What aspects of this workshop/course were most useful or valuable?', required: true },
  { key: 'improvements', n: 10, label: 'How would you improve this workshop/course?', required: true },
  {
    key: 'complaints',
    n: 11,
    label: 'Do you have any complaints from the instructor? (Express openly)',
    required: false,
    placeholder: 'Leave blank if none',
  },
] as const

export function FeedbackForm({ preview = false }: { preview?: boolean }) {
  const { address } = useAccount()
  const [form, setForm] = useState<FormState>(() => loadDraft(address))
  const [showErrors, setShowErrors] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  // Persist draft locally so a refresh doesn't lose answers.
  useEffect(() => {
    try {
      localStorage.setItem(draftKey(address), JSON.stringify(form))
    } catch {
      /* ignore */
    }
  }, [form, address])

  // ---- Chain reads -------------------------------------------------------
  const coursesQuery = useReadContract({
    address: FEEDBACK_CONTRACT,
    abi: feedbackAbi,
    functionName: 'getCourses',
    query: { enabled: !!FEEDBACK_CONTRACT },
  })
  const courses = useMemo(
    () =>
      (coursesQuery.data ?? (FEEDBACK_CONTRACT ? [] : DEFAULT_COURSES))
        .map((c, id) => ({ id, name: c.name, active: c.active }))
        .filter((c) => c.active),
    [coursesQuery.data],
  )

  // Auto-select when there's only one course.
  useEffect(() => {
    if (form.courseId == null && courses.length === 1) set('courseId', courses[0].id)
  }, [courses, form.courseId])

  const submittedQuery = useReadContract({
    address: FEEDBACK_CONTRACT,
    abi: feedbackAbi,
    functionName: 'hasSubmitted',
    args: form.courseId != null && address ? [BigInt(form.courseId), address] : undefined,
    query: { enabled: !!FEEDBACK_CONTRACT && !!address && form.courseId != null },
  })

  // ---- Write ------------------------------------------------------------
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: write.data })
  const busy = write.isPending || receipt.isLoading

  useEffect(() => {
    if (receipt.isSuccess) {
      submittedQuery.refetch()
      try {
        localStorage.removeItem(draftKey(address))
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess])

  // ---- Validation -------------------------------------------------------
  const missing = useMemo(() => {
    const m: string[] = []
    if (form.courseId == null) m.push('q-course')
    form.ratings.forEach((r, i) => r == null && m.push(`rating-${i}`))
    if (!form.mostUseful.trim()) m.push('q-mostUseful')
    if (!form.improvements.trim()) m.push('q-improvements')
    if (form.reason == null) m.push('q-reason')
    if (form.recommend == null) m.push('q-recommend')
    if (form.wouldPay == null) m.push('q-wouldPay')
    return m
  }, [form])
  const tooLong =
    bytes(form.name) > MAX_NAME_BYTES ||
    [form.mostUseful, form.improvements, form.complaints].some((t) => bytes(t) > MAX_TEXT_BYTES)

  const totalRequired = RATING_COUNT + 6
  const progress = Math.round(((totalRequired - missing.length) / totalRequired) * 100)

  const sectionComplete = (offset: number, count: number) =>
    form.ratings.slice(offset, offset + count).every((r) => r != null)

  const nav = [
    { id: 'sec-course', label: 'Course', done: form.courseId != null },
    ...RATING_SECTIONS.map((s, i) => ({
      id: `sec-${s.id}`,
      label: s.title,
      done: sectionComplete(SECTION_OFFSETS[i], s.items.length),
    })),
    { id: 'sec-thoughts', label: 'Your thoughts', done: !!form.mostUseful.trim() && !!form.improvements.trim() },
    {
      id: 'sec-about',
      label: 'Wrap-up',
      done: form.reason != null && form.recommend != null && form.wouldPay != null,
    },
  ]

  const onSubmit = () => {
    if (missing.length || tooLong) {
      setShowErrors(true)
      const first = missing[0]
      if (first) document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (preview) return setNotice('Preview mode — connect a wallet to submit.')
    if (!FEEDBACK_CONTRACT) return setNotice('Contract address not configured.')
    setNotice(null)
    const input: FeedbackInput = {
      courseId: form.courseId!,
      name: form.name.trim(),
      ratings: form.ratings as unknown as FeedbackInput['ratings'],
      mostUseful: form.mostUseful.trim(),
      improvements: form.improvements.trim(),
      complaints: form.complaints.trim(),
      reason: form.reason!,
      recommend: form.recommend!,
      wouldPay: form.wouldPay!,
    }
    write.writeContract({ address: FEEDBACK_CONTRACT, abi: feedbackAbi, functionName: 'submitFeedback', args: [input] })
  }

  const selectedCourse = courses.find((c) => c.id === form.courseId)

  // ---- Already submitted / success -------------------------------------
  if (receipt.isSuccess || submittedQuery.data === true) {
    return (
      <SubmittedCard
        courseName={selectedCourse?.name ?? 'this course'}
        txHash={receipt.isSuccess ? write.data : undefined}
        canChooseAnother={courses.length > 1}
        onChooseAnother={() => {
          write.reset()
          set('courseId', null)
        }}
      />
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* ---- Side navigation ---- */}
      <aside className="hidden lg:block">
        <nav className="sticky top-28 space-y-1">
          <ProgressRing value={progress} />
          <ol className="mt-6 space-y-1">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <span
                    className={cx(
                      'size-2 rounded-full transition',
                      n.done ? 'bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/70' : 'bg-zinc-700',
                    )}
                  />
                  {n.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      {/* ---- Form ---- */}
      <form
        className="space-y-6 pb-36"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <SectionCard id="sec-course" number="1–2" title="Workshop & you" complete={form.courseId != null}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div id="q-course" className="scroll-mt-32">
              <FieldLabel htmlFor="course" error={showErrors && form.courseId == null}>
                1. Workshop / course name
              </FieldLabel>
              <select
                id="course"
                className={cx('field', showErrors && form.courseId == null && 'border-rose-500/50')}
                value={form.courseId ?? ''}
                onChange={(e) => set('courseId', e.target.value === '' ? null : Number(e.target.value))}
                disabled={coursesQuery.isLoading}
              >
                <option value="" disabled>
                  {coursesQuery.isLoading ? 'Loading courses…' : 'Select a workshop / course'}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="name" optional>
                2. Your name
              </FieldLabel>
              <input
                id="name"
                className="field"
                placeholder="Leave blank to stay anonymous"
                value={form.name}
                maxLength={MAX_NAME_BYTES}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>
        </SectionCard>

        {RATING_SECTIONS.map((s, i) => (
          <SectionCard
            key={s.id}
            id={`sec-${s.id}`}
            number={s.number}
            title={s.title}
            subtitle={s.subtitle ?? `Rate from 1 (${s.scale[0]}) to 5 (${s.scale[4]})`}
            complete={sectionComplete(SECTION_OFFSETS[i], s.items.length)}
          >
            <RatingMatrix
              section={s}
              offset={SECTION_OFFSETS[i]}
              values={form.ratings}
              showErrors={showErrors}
              onChange={(idx, v) =>
                setForm((f) => {
                  const ratings = [...f.ratings]
                  ratings[idx] = v
                  return { ...f, ratings }
                })
              }
            />
          </SectionCard>
        ))}

        <SectionCard
          id="sec-thoughts"
          number="9–11"
          title="In your own words"
          subtitle="Be specific — your answers help shape the next cohort."
          complete={!!form.mostUseful.trim() && !!form.improvements.trim()}
        >
          <div className="space-y-5">
            {TEXT_QUESTIONS.map((q) => {
              const err = showErrors && q.required && !form[q.key].trim()
              return (
                <div key={q.key} id={`q-${q.key}`} className="scroll-mt-32">
                  <FieldLabel htmlFor={q.key} optional={!q.required} error={err}>
                    {q.n}. {q.label}
                  </FieldLabel>
                  <textarea
                    id={q.key}
                    rows={4}
                    className={cx('field resize-y', err && 'border-rose-500/50')}
                    placeholder={'placeholder' in q ? q.placeholder : 'Type your answer…'}
                    value={form[q.key]}
                    onChange={(e) => set(q.key, e.target.value)}
                  />
                  <div className="mt-1 flex justify-end">
                    <CharCount value={form[q.key]} max={MAX_TEXT_BYTES} />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        <SectionCard
          id="sec-about"
          number="12–14"
          title="Wrap-up"
          complete={form.reason != null && form.recommend != null && form.wouldPay != null}
        >
          <div className="space-y-6">
            <ChoiceGroup
              id="q-reason"
              label="12. Why did you choose this workshop/course?"
              options={REASON_OPTIONS.map((label, value) => ({ label, value }))}
              value={form.reason}
              onChange={(v) => set('reason', v)}
              error={showErrors && form.reason == null}
            />
            <ChoiceGroup
              id="q-recommend"
              label="13. How likely are you to recommend this workshop/course to others?"
              options={RECOMMEND_OPTIONS.map((label, value) => ({ label, value }))}
              value={form.recommend}
              onChange={(v) => set('recommend', v)}
              error={showErrors && form.recommend == null}
            />
            <ChoiceGroup
              id="q-wouldPay"
              label="14. If this workshop/course were charged, would you have paid to attend it?"
              options={WOULD_PAY_OPTIONS.map((label) => ({ label, value: label }))}
              value={form.wouldPay == null ? null : form.wouldPay ? 'Yes' : 'No'}
              onChange={(v) => set('wouldPay', v === 'Yes')}
              error={showErrors && form.wouldPay == null}
            />
          </div>
        </SectionCard>

        <p className="flex items-start gap-2 px-2 text-xs leading-relaxed text-zinc-500">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Your feedback is written to a public smart contract on the Sepolia testnet and is linked to your wallet
          address. Leaving the name blank keeps it pseudonymous, but anyone can read the answers on-chain.
        </p>

        {/* ---- Sticky submit bar ---- */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6">
          <div className="glass mx-auto flex max-w-6xl flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
            <div className="flex flex-1 items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs tabular-nums text-zinc-400">
                {missing.length ? `${missing.length} left` : 'All done'} · {progress}%
              </span>
            </div>

            {(write.error || receipt.error || notice || (showErrors && (missing.length > 0 || tooLong))) && (
              <p className="flex items-center gap-2 text-xs text-rose-300 sm:max-w-xs">
                <AlertTriangle className="size-4 shrink-0" />
                {write.error || receipt.error
                  ? friendlyError(write.error ?? receipt.error)
                  : showErrors && missing.length
                    ? `Please answer the ${missing.length} highlighted question${missing.length > 1 ? 's' : ''}.`
                    : showErrors && tooLong
                      ? 'One of your answers is too long.'
                      : notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className={cx(
                'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-display text-sm font-semibold text-white transition',
                'bg-gradient-to-r from-violet-600 to-cyan-500 shadow-lg shadow-violet-600/25 hover:brightness-110',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100',
              )}
            >
              {write.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Confirm in wallet…
                </>
              ) : receipt.isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Writing to Sepolia…
                </>
              ) : preview ? (
                <>
                  <Sparkles className="size-4" /> Preview mode
                </>
              ) : (
                <>
                  <Send className="size-4" /> Submit on-chain
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function ProgressRing({ value }: { value: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4">
      <svg viewBox="0 0 80 80" className="size-16 -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div>
        <div className="font-display text-2xl font-semibold text-white tabular-nums">{value}%</div>
        <div className="text-xs text-zinc-500">complete</div>
      </div>
    </div>
  )
}
