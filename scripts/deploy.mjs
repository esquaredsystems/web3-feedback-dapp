// Deploys WorkshopFeedback to Sepolia (or any RPC) and records the address in .env.local.
//
// Usage:  npm run deploy
// Needs in .env:  DEPLOYER_PRIVATE_KEY=0x...   SEPOLIA_RPC_URL=https://...
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INITIAL_COURSES = ['Blockchain and DeFi']

const pk = process.env.DEPLOYER_PRIVATE_KEY
const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
if (!pk) {
  console.error('Missing DEPLOYER_PRIVATE_KEY in .env (see .env.example)')
  process.exit(1)
}

const artifactPath = resolve(root, 'artifacts/WorkshopFeedback.json')
if (!existsSync(artifactPath)) {
  console.error('Run `npm run compile` first.')
  process.exit(1)
}
const { abi, bytecode } = JSON.parse(readFileSync(artifactPath, 'utf8'))

const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)
const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) })
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) })

const balance = await publicClient.getBalance({ address: account.address })
console.log(`Deployer ${account.address} — balance ${Number(balance) / 1e18} SepoliaETH`)

const hash = await walletClient.deployContract({ abi, bytecode, args: [INITIAL_COURSES] })
console.log(`Deploy tx: https://sepolia.etherscan.io/tx/${hash}`)
const receipt = await publicClient.waitForTransactionReceipt({ hash })
const address = receipt.contractAddress
console.log(`WorkshopFeedback deployed at ${address} (block ${receipt.blockNumber})`)

// Write/replace VITE_FEEDBACK_CONTRACT in .env.local so the frontend picks it up.
const envLocal = resolve(root, '.env.local')
let env = existsSync(envLocal) ? readFileSync(envLocal, 'utf8') : ''
const line = `VITE_FEEDBACK_CONTRACT=${address}`
env = /^VITE_FEEDBACK_CONTRACT=.*$/m.test(env)
  ? env.replace(/^VITE_FEEDBACK_CONTRACT=.*$/m, line)
  : `${env}${env && !env.endsWith('\n') ? '\n' : ''}${line}\n`
writeFileSync(envLocal, env)
console.log('Saved to .env.local — restart `npm run dev` to use it.')
