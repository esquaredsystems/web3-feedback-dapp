import { ArrowUpRight, CheckCircle2, RotateCcw } from 'lucide-react'
import { explorerTx } from '../lib/wagmi'

export function SubmittedCard({
  courseName,
  txHash,
  canChooseAnother,
  onChooseAnother,
}: {
  courseName: string
  txHash?: string
  canChooseAnother: boolean
  onChooseAnother: () => void
}) {
  return (
    <div className="glass relative mx-auto max-w-xl overflow-hidden p-8 text-center sm:p-12 animate-fade-up">
      <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative mx-auto grid size-16 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15">
        <CheckCircle2 className="size-8 text-emerald-300" />
      </div>
      <h2 className="relative mt-6 font-display text-2xl font-semibold text-white sm:text-3xl">
        {txHash ? 'Thank you! Feedback recorded.' : 'Feedback already submitted'}
      </h2>
      <p className="relative mt-3 text-zinc-400">
        {txHash ? (
          <>
            Your feedback for <span className="text-zinc-200">{courseName}</span> is now permanently stored on the
            Sepolia blockchain.
          </>
        ) : (
          <>
            This wallet has already submitted feedback for <span className="text-zinc-200">{courseName}</span>. Each
            wallet can submit once per course.
          </>
        )}
      </p>
      <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {txHash && (
          <a
            href={explorerTx(txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 font-display text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:brightness-110"
          >
            View on Etherscan <ArrowUpRight className="size-4" />
          </a>
        )}
        {canChooseAnother && (
          <button
            type="button"
            onClick={onChooseAnother}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-white/[0.08]"
          >
            <RotateCcw className="size-4" /> Another course
          </button>
        )}
      </div>
    </div>
  )
}
