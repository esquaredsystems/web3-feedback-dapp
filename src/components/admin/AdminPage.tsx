import { useMemo, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { Loader2, Lock, RefreshCw } from 'lucide-react'
import { feedbackAbi } from '../../contract/abi'
import { FEEDBACK_CONTRACT, explorerAddress } from '../../lib/wagmi'
import { cx } from '../ui'
import { Overview } from './Overview'
import { Responses } from './Responses'
import { Courses } from './Courses'
import { SAMPLE_COURSES, SAMPLE_FEEDBACK } from './sampleData'
import { shortAddr, type Course, type Feedback } from './types'

const PAGE = 25n // feedback items fetched per RPC call

type Tab = 'overview' | 'responses' | 'courses'

export function AdminPage({ isOwner, owner, preview }: { isOwner: boolean; owner?: string; preview: boolean }) {
  const { address } = useAccount()
  const [tab, setTab] = useState<Tab>('overview')
  const [courseFilter, setCourseFilter] = useState<number | 'all'>('all')
  const enabled = !!FEEDBACK_CONTRACT && isOwner && !preview

  // ---- Data -------------------------------------------------------------
  const coursesQ = useReadContract({
    address: FEEDBACK_CONTRACT,
    abi: feedbackAbi,
    functionName: 'getCourses',
    query: { enabled },
  })
  const countQ = useReadContract({
    address: FEEDBACK_CONTRACT,
    abi: feedbackAbi,
    functionName: 'feedbackCount',
    query: { enabled },
  })
  const count = countQ.data ?? 0n
  const pages = Array.from({ length: Number((count + PAGE - 1n) / PAGE) }, (_, i) => BigInt(i) * PAGE)
  const feedbackQ = useReadContracts({
    contracts: pages.map((offset) => ({
      address: FEEDBACK_CONTRACT!,
      abi: feedbackAbi,
      functionName: 'getFeedbacks' as const,
      args: [offset, PAGE] as const,
    })),
    allowFailure: false,
    query: { enabled: enabled && pages.length > 0 },
  })

  const courses: Course[] = useMemo(
    () =>
      preview
        ? SAMPLE_COURSES
        : (coursesQ.data ?? []).map((c, id) => ({ id, name: c.name, active: c.active })),
    [coursesQ.data, preview],
  )
  const all = useMemo(() => {
    const list: Feedback[] = preview ? SAMPLE_FEEDBACK : (feedbackQ.data ?? []).flat()
    return list.map((f, id) => ({ ...f, id }))
  }, [feedbackQ.data, preview])
  const filtered = courseFilter === 'all' ? all : all.filter((f) => f.courseId === courseFilter)
  const counts = useMemo(
    () => all.reduce<Record<number, number>>((m, f) => ((m[f.courseId] = (m[f.courseId] ?? 0) + 1), m), {}),
    [all],
  )

  const refetch = () => {
    coursesQ.refetch()
    countQ.refetch().then(() => feedbackQ.refetch())
  }
  const loading = !preview && (coursesQ.isLoading || countQ.isLoading || feedbackQ.isLoading)
  const error = coursesQ.error ?? countQ.error ?? feedbackQ.error

  // ---- Access -----------------------------------------------------------
  if (!preview && !isOwner) {
    return (
      <div className="glass mx-auto max-w-lg p-8 text-center animate-fade-up">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300">
          <Lock className="size-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-white">Owner only</h2>
        <p className="mt-2 text-zinc-400">
          The dashboard is available to the contract owner
          {owner ? (
            <>
              {' '}
              (<span className="font-mono text-zinc-300">{shortAddr(owner)}</span>)
            </>
          ) : null}
          . You're connected as{' '}
          <span className="font-mono text-zinc-300">{address ? shortAddr(address) : 'no wallet'}</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Feedback <span className="text-gradient">dashboard</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Live from the contract
            {FEEDBACK_CONTRACT && (
              <>
                {' '}
                <a
                  className="font-mono text-zinc-300 underline decoration-white/20 underline-offset-2 hover:text-white"
                  href={explorerAddress(FEEDBACK_CONTRACT)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shortAddr(FEEDBACK_CONTRACT)}
                </a>
              </>
            )}
            {preview && ' · sample data (preview)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {courses.length > 1 && tab !== 'courses' && (
            <select
              className="field h-10 w-auto py-0 text-sm"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={refetch}
            disabled={preview}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw className={cx('size-4', feedbackQ.isFetching && 'animate-spin')} /> Refresh
          </button>
        </div>
      </div>

      <div role="tablist" className="mb-6 inline-flex rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1">
        {(
          [
            ['overview', 'Summary'],
            ['responses', `Responses (${filtered.length})`],
            ['courses', 'Courses'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx(
              'rounded-xl px-4 py-2 text-sm font-medium transition',
              tab === id ? 'bg-white/[0.09] text-white shadow' : 'text-zinc-400 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="glass rounded-2xl p-6 text-sm text-rose-300">
          Couldn't read from the contract: {error.message.split('\n')[0]}
        </div>
      ) : loading ? (
        <div className="flex items-center gap-3 p-10 text-zinc-400">
          <Loader2 className="size-5 animate-spin" /> Loading feedback from Sepolia…
        </div>
      ) : tab === 'overview' ? (
        <Overview feedbacks={filtered} />
      ) : tab === 'responses' ? (
        <Responses feedbacks={filtered} courses={courses} />
      ) : (
        <Courses courses={courses} counts={counts} preview={preview} onChanged={refetch} />
      )}
    </div>
  )
}
