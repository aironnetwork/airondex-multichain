# AironDex Multichain

<p align="center">
  <img src="https://raw.githubusercontent.com/aironnetwork/frontend-configs/refs/heads/main/configs/network-icons/airon.svg" alt="AironDex Logo" width="120" />
</p>

<p align="center"><b>Fast, gas-efficient DEX with multi-chain support.</b></p>

AironDex Multichain adalah decentralized exchange (DEX) yang berfokus pada low-cost swaps, liquidity pools, dan analytics — dibangun di BNB Smart Chain (BSC) dan kompatibel dengan berbagai jaringan EVM lainnya.

---

## ✨ Features

- ⚡ **Low-cost swaps**: Optimized untuk BNB Chain dengan gas rendah  
- 🌐 **Multi-chain token support**: Ethereum, BSC, Sepolia, dan jaringan EVM lain  
- 💧 **Liquidity Pools & LP Rewards**: Uniswap V2-style AMM  
- 🔒 **Security Controls**: Timelock, pausability, role-based access  
- 📊 **Analytics hooks**: TVL, volume, TradingView adapter  
- 🪪 **Permit / Permit2 support**: UX lebih smooth tanpa manual approve

---

## 🧱 Technology Stack

- **Blockchain:** BNB Smart Chain + EVM-compatible chains  
- **Smart Contracts:** Solidity ^0.x.x (OpenZeppelin)  
- **Frontend:** Next.js + React + wagmi / ethers.js  
- **Dev Tooling:** Hardhat (tests, deploy, verify)

---

## 🌐 Supported Networks

- **BNB Smart Chain Mainnet** (Chain ID: 56)  
- **BNB Smart Chain Testnet** (Chain ID: 97)  
- **Ethereum Mainnet** (Chain ID: 1)  
- **Sepolia Testnet** (Chain ID: 11155111)  
- *(AironChain Testnet/Mainnet coming soon)*

---

## 📜 Contract Addresses

| Network        | Factory/Core | Router | Wrapped Native | Governance/Timelock |
|----------------|--------------|--------|----------------|----------------------|
| BNB Mainnet    | `0x...`      | `0x...`| `0x...` (WBNB) | `0x...`              |
| BNB Testnet    | `0x...`      | `0x...`| `0x...` (WBNB) | `0x...`              |
| Ethereum       | `0x...`      | `0x...`| `0x...` (WETH) | `0x...`              |
| Sepolia        | `0x...`      | `0x...`| `0x...` (WETH) | `0x...`              |

**Token Addresses (optional):**

| Network     | Symbol | Address   |
|-------------|--------|-----------|
| BNB Mainnet | AIR    | `0x...`   |
| BNB Testnet | AIR    | `0x...`   |
| Ethereum    | AIR    | `0x...`   |
| Sepolia     | AIR    | `0x...`   |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20.x
- pnpm / yarn / npm
- Hardhat / Foundry (opsional)

### 1) Clone & Install
```bash
git clone <YOUR_REPO_URL> airondex
cd airondex
pnpm install
