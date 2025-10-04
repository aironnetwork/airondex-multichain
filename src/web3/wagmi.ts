import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, bsc, base, arbitrum, sepolia, bscTestnet, baseSepolia, arbitrumSepolia } from 'wagmi/chains'
import { defineChain } from 'viem'
import { http } from 'wagmi'
import aironIcon from '../assets/chain/airon.png' 

export const aironTestnet = {
  ...defineChain({
    id: 2030,
    name: 'Airon Testnet',
    nativeCurrency: { name: 'Test Airon', symbol: 'tAIR', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc-testnet.airon.network'] },
      public:  { http: ['https://rpc-testnet.airon.network'] },
    },
    blockExplorers: { default: { name: 'AironScan', url: 'https://testnet.aironscan.com' } },
    testnet: true,
  }),
  iconUrl: aironIcon,    
  iconBackground: '#0b1612',
} as const

const projectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined

export const config = getDefaultConfig({
  appName: 'AIRON DEX',
  projectId: projectId ?? 'MISSING_PROJECT_ID',
  chains: [bsc, mainnet, base, arbitrum, sepolia, bscTestnet, baseSepolia, arbitrumSepolia, aironTestnet],
  transports: {
    [bsc.id]: http('https://bsc-rpc.publicnode.com'),
    [mainnet.id]: http('https://eth.drpc.org'),
    [base.id]: http('https://base-rpc.publicnode.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [sepolia.id]: http('https://sepolia.drpc.org'),
    [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [aironTestnet.id]: http('https://rpc-testnet.airon.network'),
  },
  ssr: false,
})
