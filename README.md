# Workshop Feedback DApp

A React DApp where participants connect an Ethereum wallet (Sepolia testnet) and submit workshop/course feedback. Each response is stored on-chain in the `WorkshopFeedback` smart contract.

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · wagmi 2 + viem · RainbowKit · Solidity 0.8

## Quick start

```bash
npm install
npm run compile                # compile the contract → artifacts/ + src/contract/abi.ts
cp .env.example .env           # add DEPLOYER_PRIVATE_KEY (a Sepolia-only test wallet!)
npm run deploy                 # deploys to Sepolia, writes VITE_FEEDBACK_CONTRACT into .env.local
npm run dev                    # http://localhost:5173
```

The deployer wallet needs a little Sepolia ETH. You can get some from the [Google Cloud faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or the [Alchemy faucet](https://www.alchemy.com/faucets/ethereum-sepolia).

**Using Remix instead:** paste `contracts/WorkshopFeedback.sol` into [Remix](https://remix.ethereum.org), deploy with the constructor argument `["Blockchain and DeFi"]` using "Injected Provider – MetaMask" on Sepolia, then put the address in `.env.local`:

```
VITE_FEEDBACK_CONTRACT=0xYourContractAddress
```

**Preview without a wallet (dev only):** open `http://localhost:5173/?preview` for the form, or `http://localhost:5173/?preview#/admin` for the dashboard with sample data.

## Owner dashboard

When you connect with the wallet that deployed the contract (the owner), a **Form / Dashboard** switch appears in the header (or go to `#/admin`). The dashboard has three tabs:

- **Summary:** response count, overall average, average per question and section, and breakdowns for Q12–14. Hover a row to see how many people chose each score.
- **Responses:** every submission, newest first, with all ratings and written answers. You can search by name, wallet or text.
- **Courses:** add a course, or close and reopen one. Each of these is a transaction signed by the owner wallet.

Other wallets see an "Owner only" message. The data is still public on-chain, so this only hides the page in the app.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_FEEDBACK_CONTRACT` | `.env.local` | Deployed contract address (required to submit) |
| `VITE_WALLETCONNECT_PROJECT_ID` | `.env.local` | Optional. Enables WalletConnect/mobile wallets ([cloud.reown.com](https://cloud.reown.com)) |
| `VITE_SEPOLIA_RPC_URL` | `.env.local` | Optional custom RPC |
| `DEPLOYER_PRIVATE_KEY` | `.env` | Used only by `npm run deploy`. Never commit this file. |
| `SEPOLIA_RPC_URL` | `.env` | RPC used by the deploy script |

## Smart contract

`contracts/WorkshopFeedback.sol`

- `submitFeedback(FeedbackInput)` stores one response per wallet per course. It checks that every rating is between 1 and 5 and caps text lengths (name 64 bytes, other text fields 1000 bytes). A submission costs about 234k gas.
- The owner can manage the course dropdown with `getCourses()`, `addCourse(name)` and `setCourseActive(id, bool)`. The frontend reads the list from the chain, so adding a course needs no redeploy of the app.
- Read feedback with `feedbackCount()`, `getFeedback(id)` and `getFeedbacks(offset, limit)` for dashboards and exports.
- The contract emits `FeedbackSubmitted(feedbackId, courseId, submitter)`.

The 30 ratings are stored as a `uint8[30]` in this order (see `src/lib/questions.ts`):

| Index | Section |
|---|---|
| 0 | Instructor effort |
| 1 | Learning experience |
| 2–6 | Discipline |
| 7–13 | Teaching skill |
| 14–23 | Communication (1 = Strongly Disagree … 5 = Strongly Agree) |
| 24–29 | Outcomes |

Enums: `reason` 0 = Official requirement, 1 = Fits my schedule, 2 = Personal interest. `recommend` 0 = Yes, 1 = No, 2 = Maybe.

> **Privacy note:** blockchain data is public. Anyone can read the answers and link them to the submitting wallet address. The name field is optional so participants can stay pseudonymous.

## Project structure

```
contracts/WorkshopFeedback.sol   Solidity contract
scripts/compile.mjs              solc-js build → artifacts + typed ABI
scripts/deploy.mjs               viem deploy to Sepolia
src/lib/questions.ts             form definition (all questions & scales)
src/lib/wagmi.ts                 chain / wallet config
src/components/FeedbackForm.tsx  form, validation, on-chain submit
src/components/ui.tsx            rating matrix, choice pills, section cards
```
