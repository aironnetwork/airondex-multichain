# AironDex Multichain

<p align="center">
  <img src="https://raw.githubusercontent.com/aironnetwork/frontend-configs/refs/heads/main/configs/network-icons/airon.svg" alt="AironDex Logo" width="120" />
</p>

<p align="center"><b>Fast, gas-efficient DEX with multi-chain support.</b></p>

**AironDex Multichain** is a decentralized exchange (DEX) designed for low-cost swaps, liquidity pools, and analytics — built on BNB Smart Chain (BSC) and compatible with multiple EVM networks.

---

## ✨ Features

- ⚡ **Low-cost swaps**: Optimized for BNB Chain with minimal gas fees  
- 🌐 **Multi-chain support**: Ethereum, BSC, Sepolia, Arbitrum, Base, and more  
- 💧 **Liquidity Pools & LP Rewards**: Uniswap V2-style AMM design  
- 🔒 **Security controls**: Timelock, pausability, role-based access  
- 📊 **Analytics ready**: TVL, volume, TradingView adapter hooks  
- 🪪 **Permit / Permit2 support**: Seamless UX without manual approvals  

---

## 🧱 Technology Stack

- **Blockchain:** BNB Smart Chain + EVM-compatible chains  
- **Smart Contracts:** Solidity ^0.x.x (OpenZeppelin based)  
- **Frontend:** Next.js + React with wagmi & ethers.js  
- **Dev Tooling:** Hardhat (deploy, verify, tests)  

---

## 🌐 Supported Networks

- **BNB Smart Chain Mainnet** (Chain ID: 56)  
- **BNB Smart Chain Testnet** (Chain ID: 97)  
- **Ethereum Mainnet** (Chain ID: 1)  
- **Sepolia Testnet** (Chain ID: 11155111)  
- **Arbitrum One** (Chain ID: 42161)  
- **Base Mainnet** (Chain ID: 8453)  
- **Testnets:** Arbitrum Sepolia (421614), Base Sepolia (84532)  
- *(AironChain Testnet/Mainnet coming soon)*  

---

## 📜 Contract Addresses

| Chain ID | Network              | Router Address                                                      | Factory Address                                                     | Wrapped Native Token                                  |
|----------|----------------------|---------------------------------------------------------------------|----------------------------------------------------------------------|-------------------------------------------------------|
| 56       | BNB Smart Chain      | `0x10ED43C718714eb63d5aA57B78B54704E256024E`                        | `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`                         | `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c` (WBNB)   |
| 1        | Ethereum Mainnet     | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`                        | `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`                         | `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2` (WETH)   |
| 8453     | Base Mainnet         | `0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb`                        | `0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E`                         | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` (WETH)   |
| 42161    | Arbitrum One         | `0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb`                        | `0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E`                         | `0x4200000000000000000000000000000000000006` (WETH)   |
| 97       | BNB Testnet          | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1`                        | `0x6725F303b657a9451d8BA641348b6761A6CC7a17`                         | `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd` (tBNB)   |
| 11155111 | Sepolia Testnet      | `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3`                        | `0xF62c03E08ada871A0bEb309762E260a7a6a880E6`                         | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` (WETH)   |
| 421614   | Arbitrum Sepolia     | `0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb`                        | `0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E`                         | `0x1bdc540dEB9Ed1fA29964DeEcCc524A8f5e2198e` (WETH)   |
| 84532    | Base Sepolia         | `0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb`                        | `0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E`                         | `0x4200000000000000000000000000000000000006` (WETH)   |
| 2030     | AironChain Testnet   | `0x224cd6F72660fE1eFA650255a2bCa9670b4d38c1`                        | `0xA65CB0c559aA59dcB40e256A2DBAAa403181Bd11`                         | `0x11C43293631a7c810918A10164016cEe458ac64D` (WAIR)   |

---

## 💠 Token Addresses (optional)

| Network            | Symbol | Address                                   |
|--------------------|--------|-------------------------------------------|
| BNB Mainnet        | AIR    | `0x11C43293631a7c810918A10164016cEe458ac64D` |
| BNB Testnet        | AIR    | `0x...`                                   |
| Ethereum Mainnet   | AIR    | `0x...`                                   |
| Sepolia Testnet    | AIR    | `0x...`                                   |
| AironChain Testnet | WAIR   | `0x11C43293631a7c810918A10164016cEe458ac64D` |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20.x  
- pnpm / yarn / npm  
- Hardhat / Foundry (optional, for contracts)  

### 1) Clone & Install
```bash
git clone <YOUR_REPO_URL> airondex
cd airondex
pnpm install
