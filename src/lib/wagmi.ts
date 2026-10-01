import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { isAddress, type Address } from 'viem'

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined
const rpcUrl = (import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined) || 'https://ethereum-sepolia-rpc.publicnode.com'

// WalletConnect-based wallets (QR / mobile) are only offered when a project id is configured.
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Browser wallets',
      wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet, injectedWallet],
    },
    ...(wcProjectId ? [{ groupName: 'Mobile', wallets: [walletConnectWallet, trustWallet] }] : []),
  ],
  {
    appName: 'Workshop Feedback',
    appDescription: 'On-chain feedback for workshops and courses',
    projectId: wcProjectId || 'walletconnect-disabled',
  },
)

export const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: { [sepolia.id]: http(rpcUrl) },
  ssr: false,
})

const rawAddress = (import.meta.env.VITE_FEEDBACK_CONTRACT as string | undefined)?.trim()
export const FEEDBACK_CONTRACT: Address | undefined = rawAddress && isAddress(rawAddress) ? rawAddress : undefined

export const TARGET_CHAIN = sepolia
export const explorerTx = (hash: string) => `https://sepolia.etherscan.io/tx/${hash}`
export const explorerAddress = (addr: string) => `https://sepolia.etherscan.io/address/${addr}`

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
