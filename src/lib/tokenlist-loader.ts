
import type { Address } from "viem";
import { TRUSTWALLET_FOLDER, TOKEN_LIST_URLS } from "../config/tokenlists";

export type TokenInfo = {
  chainId: number;
  address: Address;
  name?: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

type TokenList = {
  name: string;
  tokens: TokenInfo[];
};

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch tokenlist failed: ${url}`);
  return res.json();
}

export async function loadChainTokenList(chainId: number): Promise<TokenInfo[]> {
  const urls = TOKEN_LIST_URLS[chainId] || [];
  const lists: TokenList[] = [];

  for (const url of urls) {
    try {
      const json = await fetchJson(url);
      if (json?.tokens?.length) lists.push(json as TokenList);
    } catch (e) {
      console.warn("tokenlist load error", url, e);
    }
  }


  const map = new Map<string, TokenInfo>();
  for (const l of lists) {
    for (const t of l.tokens) {
      if (t.chainId !== chainId) continue;
      const key = `${t.chainId}-${t.address.toLowerCase()}`;
      if (!map.has(key)) map.set(key, t);
    }
  }
  return Array.from(map.values());
}

export function resolveLogo(chainId: number, address: string, logoURI?: string) {
 
  if (logoURI) return logoURI;
  
  const folder = TRUSTWALLET_FOLDER[chainId] || "ethereum";
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${folder}/assets/${address}/logo.png`;
}
