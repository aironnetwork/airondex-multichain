// src/hooks/useTokens.ts
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { TOKEN_LIST_URLS, TRUSTWALLET_FOLDER } from "../config/tokenlists";
import defaultLogo from "../assets/token/default.png";
import { listCustomTokens, onCustomTokensUpdated } from "../lib/customTokens";

type RawList = {
  tokens?: Array<{ chainId:number; address:string; symbol:string; name:string; decimals:number; logoURI?:string }>;
};

export type TokenMeta = {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoResolved: string;
  source?: "remote" | "custom";
};

function trustWalletLogo(chainId:number, address:string){
  const folder = TRUSTWALLET_FOLDER[chainId];
  return folder
    ? `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${folder}/assets/${address}/logo.png`
    : null;
}

export function useTokens(chainId: number, q: string, account?: Address | null) {
  const [loading, setLoading] = useState(false);
  const [remoteTokens, setRemoteTokens] = useState<TokenMeta[]>([]);
  const [rev, setRev] = useState(0);

  
  useEffect(() => onCustomTokensUpdated(() => setRev(v => v + 1)), []);

  useEffect(() => {
    let alive = true;
    const urls = TOKEN_LIST_URLS[chainId] || [];
    if (urls.length === 0) { setRemoteTokens([]); return; }

    (async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled(
          urls.map(async (u) => {
            const r = await fetch(u, { cache: "no-store" });
            if (!r.ok) throw new Error(String(r.status));
            const j = (await r.json()) as RawList;
            return j.tokens?.filter(t => t.chainId === chainId) || [];
          })
        );

        const byAddr = new Map<string, TokenMeta>();
        for (const res of results) {
          if (res.status !== "fulfilled") continue;
          for (const t of res.value) {
            const k = (t.address as string).toLowerCase();
            if (byAddr.has(k)) continue;
            byAddr.set(k, {
              chainId,
              address: t.address as Address,
              symbol: t.symbol,
              name: t.name,
              decimals: t.decimals,
              logoResolved: t.logoURI?.trim() || trustWalletLogo(chainId, t.address) || defaultLogo,
              source: "remote",
            });
          }
        }
        if (!alive) return;
        setRemoteTokens(Array.from(byAddr.values()));
      } catch {
        if (!alive) return;
        setRemoteTokens([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [chainId]);

  const merged = useMemo(() => {
    
    const customs = listCustomTokens(chainId, account).map(t => ({
      chainId: t.chainId,
      address: t.address as Address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      logoResolved: t.logoURI || trustWalletLogo(chainId, t.address) || defaultLogo,
      source: "custom" as const,
    }));

  
    const byAddr = new Map<string, TokenMeta>();
    remoteTokens.forEach(t => byAddr.set((t.address as string).toLowerCase(), t));
    customs.forEach(t => byAddr.set((t.address as string).toLowerCase(), t));

    let arr = Array.from(byAddr.values());

    const s = q.trim().toLowerCase();
    if (s) {
      arr = arr.filter(t =>
        (t.address as string).toLowerCase().includes(s) ||
        (t.symbol || "").toLowerCase().includes(s) ||
        (t.name || "").toLowerCase().includes(s)
      );
    }

    arr.sort((a,b) => a.symbol.localeCompare(b.symbol));
    return arr;
  }, [remoteTokens, chainId, q, account, rev]);

  return { loading, tokens: merged };
}

export default useTokens;
