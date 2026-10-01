import { useEffect, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { BaseError } from 'viem'
import { Loader2, Plus } from 'lucide-react'
import { feedbackAbi } from '../../contract/abi'
import { FEEDBACK_CONTRACT, explorerTx } from '../../lib/wagmi'
import { MAX_NAME_BYTES } from '../../lib/questions'
import { cx } from '../ui'
import type { Course } from './types'

export function Courses({
  courses,
  counts,
  preview,
  onChanged,
}: {
  courses: Course[]
  counts: Record<number, number>
  preview: boolean
  onChanged: () => void
}) {
  const [name, setName] = useState('')
  const [pendingId, setPendingId] = useState<number | 'new' | null>(null)
  const write = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: write.data })
  const busy = write.isPending || receipt.isLoading

  useEffect(() => {
    if (receipt.isSuccess) {
      onChanged()
      if (pendingId === 'new') setName('')
      setPendingId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess])

  const add = () => {
    const n = name.trim()
    if (!n || !FEEDBACK_CONTRACT || preview) return
    setPendingId('new')
    write.writeContract({ address: FEEDBACK_CONTRACT, abi: feedbackAbi, functionName: 'addCourse', args: [n] })
  }
  const toggle = (c: Course) => {
    if (!FEEDBACK_CONTRACT || preview) return
    setPendingId(c.id)
    write.writeContract({
      address: FEEDBACK_CONTRACT,
      abi: feedbackAbi,
      functionName: 'setCourseActive',
      args: [BigInt(c.id), !c.active],
    })
  }

  const error = write.error ?? receipt.error
  const tooLong = new TextEncoder().encode(name).length > MAX_NAME_BYTES

  return (
    <div className="space-y-6">
      <section className="glass rounded-2xl p-5 sm:p-6">
        <h3 className="font-display font-semibold text-white">Add a workshop / course</h3>
        <p className="mt-1 text-sm text-zinc-400">
          It appears in the participants' dropdown as soon as the transaction confirms.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <input
            className={cx('field flex-1', tooLong && 'border-rose-500/50')}
            placeholder="e.g. Smart Contract Security"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !name.trim() || tooLong || preview}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 font-display text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && pendingId === 'new' ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add course
          </button>
        </form>
      </section>

      <section className="glass overflow-hidden rounded-2xl">
        <ul className="divide-y divide-white/[0.06]">
          {courses.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">{c.name}</div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {counts[c.id] ?? 0} response{counts[c.id] === 1 ? '' : 's'} ·{' '}
                  <span className={c.active ? 'text-emerald-300' : 'text-zinc-400'}>
                    {c.active ? 'Open for feedback' : 'Closed'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(c)}
                disabled={busy || preview}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && pendingId === c.id && <Loader2 className="size-4 animate-spin" />}
                {c.active ? 'Close' : 'Reopen'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {write.isPending && <p className="text-sm text-zinc-400">Confirm the transaction in your wallet…</p>}
      {receipt.isLoading && write.data && (
        <p className="text-sm text-zinc-400">
          Waiting for confirmation…{' '}
          <a className="underline" href={explorerTx(write.data)} target="_blank" rel="noreferrer">
            view transaction
          </a>
        </p>
      )}
      {error && (
        <p className="text-sm text-rose-300">{error instanceof BaseError ? error.shortMessage : error.message}</p>
      )}
      <p className="text-xs text-zinc-500">
        Closing a course hides it from the form and blocks new submissions. Existing feedback is kept. Courses can't be
        deleted or renamed.
      </p>
    </div>
  )
}
