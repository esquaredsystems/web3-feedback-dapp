// Dev-only sample data so the dashboard can be previewed without a wallet: /?preview#/admin
import type { Course, Feedback } from './types'

const NAMES = ['Ayesha', '', 'Bilal', 'Hamza', '', 'Sana', 'Usman', '', 'Fatima', 'Zain', 'Hira', '']
const USEFUL = [
  'The hands-on Solidity labs and deploying our own contract.',
  'DeFi walkthroughs with real protocols — AMMs finally make sense.',
  'Wallet setup and testnet practice.',
  'Clear explanations of consensus and gas.',
]
const IMPROVE = [
  'More time for the practical sessions.',
  'Share slides before each class.',
  'Add a small group project at the end.',
  'Slightly slower pace in the DeFi module.',
]

export const SAMPLE_COURSES: Course[] = [{ id: 0, name: 'Blockchain and DeFi', active: true }]

export const SAMPLE_FEEDBACK: Feedback[] = NAMES.map((name, i) => {
  let seed = i * 9301 + 49297
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const bias = 3.2 + rnd() * 1.6
  const ratings = Array.from({ length: 30 }, () => Math.max(1, Math.min(5, Math.round(bias + (rnd() - 0.5) * 2))))
  return {
    submitter: `0x${(i + 1).toString(16).padStart(4, '0')}a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4`.slice(0, 42) as `0x${string}`,
    timestamp: BigInt(1790000000 + i * 3600 * 5),
    courseId: 0,
    reason: i % 3,
    recommend: i % 5 === 0 ? 2 : i % 7 === 0 ? 1 : 0,
    wouldPay: i % 3 !== 1,
    ratings: ratings as unknown as Feedback['ratings'],
    name,
    mostUseful: USEFUL[i % USEFUL.length],
    improvements: IMPROVE[i % IMPROVE.length],
    complaints: i % 4 === 0 ? 'Sometimes WhatsApp announcements came late.' : '',
  }
})
