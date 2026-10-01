import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Blocks, Lock, MessageSquareHeart, Wallet } from 'lucide-react'

const FEATURES = [
  { icon: Wallet, title: 'Connect', body: 'Sign in with MetaMask or any EVM wallet on Sepolia.' },
  { icon: MessageSquareHeart, title: 'Share', body: '14 quick questions about the workshop — takes ~5 minutes.' },
  { icon: Lock, title: 'Immutable', body: 'Stored on-chain. One submission per wallet, no edits.' },
]

export function Landing() {
  return (
    <div className="mx-auto max-w-3xl pt-8 text-center sm:pt-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200 animate-fade-up">
        <Blocks className="size-3.5" /> Powered by Ethereum · Sepolia testnet
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl animate-fade-up [animation-delay:80ms]">
        Your feedback, <span className="text-gradient">on-chain.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 sm:text-lg animate-fade-up [animation-delay:160ms]">
        Help us improve the workshop. Connect your wallet to rate the instructor, the content and your learning
        experience — every response is recorded transparently on the blockchain.
      </p>
      <div className="mt-9 flex justify-center animate-fade-up [animation-delay:240ms]">
        <ConnectButton label="Connect wallet to begin" showBalance={false} />
      </div>

      <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="glass rounded-2xl p-5 animate-fade-up"
            style={{ animationDelay: `${320 + i * 80}ms` }}
          >
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-violet-200">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 font-display font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
