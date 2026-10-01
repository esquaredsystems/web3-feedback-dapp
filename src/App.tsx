import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi'
import { AlertTriangle, Droplets, FileCode2, LayoutDashboard, Network, PenLine } from 'lucide-react'
import type { ReactNode } from 'react'
import { FeedbackForm } from './components/FeedbackForm'
import { Landing } from './components/Landing'
import { AdminPage } from './components/admin/AdminPage'
import { feedbackAbi } from './contract/abi'
import { FEEDBACK_CONTRACT, TARGET_CHAIN, explorerAddress } from './lib/wagmi'
import { useRoute } from './lib/useRoute'

// Dev-only: open http://localhost:5173/?preview to see the form without a wallet
// (and /?preview#/admin for the dashboard with sample data).
const PREVIEW = import.meta.env.DEV && new URLSearchParams(location.search).has('preview')

export default function App() {
  const { isConnected, chainId, address } = useAccount()
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id
  const { data: balance } = useBalance({ address, chainId: TARGET_CHAIN.id, query: { enabled: isConnected } })
  const [route, go] = useRoute()
  const { data: owner } = useReadContract({
    address: FEEDBACK_CONTRACT,
    abi: feedbackAbi,
    functionName: 'owner',
    query: { enabled: !!FEEDBACK_CONTRACT && isConnected },
  })
  const isOwner = !!address && !!owner && owner.toLowerCase() === address.toLowerCase()
  const showNav = isOwner || (PREVIEW && !isConnected)

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Backdrop />

      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#/" className="flex items-center gap-3">
            <Logo />
            <div className={`leading-tight ${showNav ? 'hidden sm:block' : ''}`}>
              <div className="font-display text-[15px] font-semibold whitespace-nowrap text-white">Workshop Feedback</div>
              <div className="hidden text-[11px] text-zinc-500 sm:block">decentralized · transparent</div>
            </div>
          </a>
          {showNav && (
            <nav className="ml-auto flex shrink-0 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
              {(
                [
                  ['form', 'Form', PenLine],
                  ['admin', 'Dashboard', LayoutDashboard],
                ] as const
              ).map(([r, label, Icon]) => (
                <button
                  key={r}
                  onClick={() => go(r)}
                  aria-current={route === r ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    route === r ? 'bg-white/[0.09] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          )}
          {(isConnected || PREVIEW) && (
            <ConnectButton accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }} chainStatus="icon" showBalance={{ smallScreen: false, largeScreen: true }} />
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {!isConnected && !PREVIEW ? (
          <Landing />
        ) : wrongNetwork ? (
          <WrongNetwork />
        ) : route === 'admin' ? (
          <AdminPage isOwner={isOwner} owner={owner} preview={PREVIEW && !isConnected} />
        ) : (
          <>
            <div className="mb-8 sm:mb-10">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Workshop <span className="text-gradient">feedback</span>
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Rate each aspect honestly — 1 is the lowest, 5 the highest. It takes about five minutes.
              </p>
            </div>

            <div className="mb-6 space-y-3">
              {!FEEDBACK_CONTRACT && (
                <Notice icon={<FileCode2 className="size-5" />} tone="amber" title="Contract not configured">
                  Set <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">VITE_FEEDBACK_CONTRACT</code> in{' '}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code> (or run{' '}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">npm run deploy</code>) to enable submissions.
                </Notice>
              )}
              {isConnected && balance && balance.value === 0n && (
                <Notice icon={<Droplets className="size-5" />} tone="violet" title="You need a little Sepolia ETH for gas">
                  Get free test ETH from the{' '}
                  <a className="underline decoration-violet-400/50 underline-offset-2 hover:text-white" href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" target="_blank" rel="noreferrer">
                    Google Cloud faucet
                  </a>{' '}
                  or{' '}
                  <a className="underline decoration-violet-400/50 underline-offset-2 hover:text-white" href="https://www.alchemy.com/faucets/ethereum-sepolia" target="_blank" rel="noreferrer">
                    Alchemy faucet
                  </a>
                  , then submit.
                </Notice>
              )}
            </div>

            <FeedbackForm key={address ?? 'preview'} preview={PREVIEW && !isConnected} />
          </>
        )}
      </main>

      {!isConnected && !PREVIEW && (
        <footer className="relative pb-10 text-center text-xs text-zinc-600">
          {FEEDBACK_CONTRACT ? (
            <a href={explorerAddress(FEEDBACK_CONTRACT)} target="_blank" rel="noreferrer" className="hover:text-zinc-400">
              Contract {FEEDBACK_CONTRACT.slice(0, 6)}…{FEEDBACK_CONTRACT.slice(-4)} on Sepolia
            </a>
          ) : (
            'Sepolia testnet'
          )}
        </footer>
      )}
    </div>
  )
}

function WrongNetwork() {
  const { switchChain, isPending } = useSwitchChain()
  return (
    <div className="glass mx-auto max-w-lg p-8 text-center animate-fade-up">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
        <Network className="size-7" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-semibold text-white">Switch to Sepolia</h2>
      <p className="mt-2 text-zinc-400">This DApp runs on the Sepolia test network. Switch networks in your wallet to continue.</p>
      <button
        onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
        disabled={isPending}
        className="mt-6 inline-flex h-12 items-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 font-display text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? 'Check your wallet…' : 'Switch network'}
      </button>
    </div>
  )
}

function Notice({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: 'amber' | 'violet'; children: ReactNode }) {
  const styles = tone === 'amber' ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200' : 'border-violet-400/20 bg-violet-500/[0.07] text-violet-200'
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm ${styles}`}>
      <span className="mt-0.5 shrink-0">{icon ?? <AlertTriangle className="size-5" />}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-zinc-400">{children}</div>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]">
      <defs>
        <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M16 2 29 9.5v13L16 30 3 22.5v-13z" fill="url(#logo)" />
      <path d="M16 9.5 22.5 13v6L16 22.5 9.5 19v-6z" fill="#07070d" opacity=".85" />
    </svg>
  )
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute -top-40 left-[10%] size-[32rem] rounded-full bg-violet-600/20 blur-[120px] animate-float" />
      <div className="absolute top-[20%] right-[-10%] size-[28rem] rounded-full bg-cyan-500/15 blur-[120px] animate-float [animation-delay:-6s]" />
      <div className="absolute bottom-[-20%] left-[30%] size-[30rem] rounded-full bg-fuchsia-600/10 blur-[140px] animate-float [animation-delay:-3s]" />
    </div>
  )
}
