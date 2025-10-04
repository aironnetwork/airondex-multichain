// src/web3/explorerLink.ts

import { getAddress, isAddress } from "viem";

export type ParsedExplorer = {
  chainId: number;
  address: `0x${string}`;
};

export function parseExplorerLink(input: string): ParsedExplorer | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }

  
  const fromPath = url.pathname.match(/\/address\/(0x[a-fA-F0-9]{40})/);
  const fromHash = url.hash.match(/(0x[a-fA-F0-9]{40})/);
  const raw = (fromPath?.[1] || fromHash?.[1] || "").toLowerCase();
  if (!raw || !isAddress(raw as `0x${string}`)) return null;

  const addr = getAddress(raw);
  const host = url.hostname.toLowerCase();


  if (host === "etherscan.io")  return { chainId: 1,     address: addr };
  if (host === "bscscan.com")   return { chainId: 56,    address: addr };
  if (host === "arbiscan.io")   return { chainId: 42161, address: addr };
  if (host === "basescan.org")  return { chainId: 8453,  address: addr };


  if (host === "sepolia.etherscan.io") return { chainId: 11155111, address: addr };
  if (host === "testnet.bscscan.com")  return { chainId: 97,       address: addr };
  if (host === "sepolia.arbiscan.io")  return { chainId: 421614,   address: addr };
  if (host === "sepolia.basescan.org" || host === "base-sepolia.basescan.org")
    return { chainId: 84532, address: addr };



  return null;
}
