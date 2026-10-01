import type { ContractFunctionReturnType } from 'viem'
import type { feedbackAbi } from '../../contract/abi'

export type Feedback = ContractFunctionReturnType<typeof feedbackAbi, 'view', 'getFeedback'>
export type Course = { id: number; name: string; active: boolean }

export const average = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)
export const fmt = (n: number, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '–')
export const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)
export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
export const fmtDate = (ts: bigint) =>
  new Date(Number(ts) * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
