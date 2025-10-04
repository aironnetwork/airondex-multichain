// Chain list untuk wagmi/viem
import {
  mainnet as ethereum,
  sepolia,
  bsc,
  bscTestnet,
  base,
  baseSepolia as baseTestnet,
  arbitrum,
  arbitrumSepolia as arbitrumTestnet,
} from "viem/chains";
import type { Chain } from 'viem';

export const aironTestnet: Chain = {
  id: 2030,
  name: "Airon Testnet",
  nativeCurrency: { name: "AIR", symbol: "AIR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.airon.network"] },   
    public:  { http: ["https://rpc.airon.network"] },
  },
  blockExplorers: {
    default: { name: "AironScan", url: "https://scan.airon.network" },
  },
  testnet: true,
};

export const MAINNETS = [bsc, ethereum, base, arbitrum];
export const TESTNETS  = [bscTestnet, sepolia, baseTestnet, arbitrumTestnet, aironTestnet];
export const ALL_CHAINS = [...MAINNETS, ...TESTNETS];
