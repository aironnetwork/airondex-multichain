import { useEffect, useMemo, useState } from "react";
import "./LiquidityStats.css";
import { useAccount, useChainId, usePublicClient, useBlockNumber } from "wagmi";
import type { Address } from "viem";
import { getAddress, formatUnits } from "viem";


import TokenIcon from "../components/TokenIcon";
import defaultLogo from "../assets/token/default.png";


import bnbLogo from "../assets/chain/bnb.png";
import ethLogo from "../assets/chain/ethereum.png";
import arbLogo from "../assets/chain/arbitrum.png";
import baseLogo from "../assets/chain/base.png";
import aironLogo from "../assets/chain/airon.png";


import { ERC20_ABI } from "../abis/liquidity";

type Row = {
  id: string;
  lp: Address;
  chainId: number;
  token0: { address: Address; symbol: string; logo: string };
  token1: { address: Address; symbol: string; logo: string };
  tvlUSD?: number | null;
  vol24hUSD?: number | null;
  dex: string;
};

const CHAIN_META: Record<number, { name: string; logo: string }> = {
  56: { name: "BNB Chain", logo: bnbLogo },
  1: { name: "Ethereum", logo: ethLogo },
  42161: { name: "Arbitrum", logo: arbLogo },
  8453: { name: "Base", logo: baseLogo },
  2030: { name: "Airon Testnet", logo: aironLogo },
};

const FACTORY_BY_CHAIN: Record<number, Address | undefined> = {
  56: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  1: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  8453: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  42161: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  2030: "0xA65CB0c559aA59dcB40e256A2DBAAa403181Bd11",
} as const;

const FACTORY_MIN_ABI = [
  { inputs: [], name: "allPairsLength", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ type: "uint256" }], name: "allPairs", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
] as const;

const MULTICALL3: Record<number, Address | null> = {
  1: "0xCA11bde05977b3631167028862be2a173976CA11",
  56: "0xCA11bde05977b3631167028862be2a173976CA11",
  8453: "0xCA11bde05977b3631167028862be2a173976CA11",
  42161: "0xCA11bde05977b3631167028862be2a173976CA11",
  2030: "0x9a7a0B49C1316c09Dd157D77fcE326e073b2CE92",
};


const PANCAKE_API_BY_CHAIN: Record<number, string | undefined> = {
  56: "https://explorer.pancakeswap.com/api/cached/pools/v2/bsc/list/top",
  1: "https://explorer.pancakeswap.com/api/cached/pools/v2/ethereum/list/top",
  42161: "https://explorer.pancakeswap.com/api/cached/pools/v2/arbitrum/list/top",
  8453: "https://explorer.pancakeswap.com/api/cached/pools/v2/base/list/top",
  
};

const WANT = 10;
const BATCH = 20;
const SCAN_MAX = 100;

function fmtUSD(n?: number | null, dp = 2) {
  if (n == null || !Number.isFinite(n)) return "Coming soon";
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: dp })}`;
}

export default function LiquidityStats() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { data: currentBlk } = useBlockNumber({ chainId, watch: true });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [gwei, setGwei] = useState<string>("–");

 
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient) return;
        const gp = await publicClient.getGasPrice();
        const n = Number(formatUnits(gp, 9));
        setGwei(`${n.toFixed(1)} Gwei`);
      } catch {
        setGwei("–");
      }
    })();
  }, [publicClient, currentBlk]);

  async function runMulti<T extends { address: Address; abi: any; functionName: string; args?: any[] }>(
    contracts: T[]
  ): Promise<Array<{ status: "success" | "failure"; result?: any }>> {
    if (!publicClient) return contracts.map(() => ({ status: "failure" as const }));
    try {
      const mcAddr = MULTICALL3[chainId] || undefined;
      const res = await publicClient.multicall({ contracts: contracts as any, allowFailure: true, multicallAddress: mcAddr });
      return res.map((r: any) => (r?.status === "success" ? { status: "success", result: r.result } : { status: "failure" }));
    } catch {
      const out: Array<{ status: "success" | "failure"; result?: any }> = [];
      for (const c of contracts) {
        try {
          const result = await publicClient!.readContract({
            address: c.address,
            abi: c.abi,
            functionName: c.functionName,
            args: c.args as any,
          });
          out.push({ status: "success", result });
        } catch {
          out.push({ status: "failure" });
        }
      }
      return out;
    }
  }

  
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        
        const api = PANCAKE_API_BY_CHAIN[chainId];
        if (api) {
          const resp = await fetch(api, { method: "GET" });
          if (!resp.ok) throw new Error(`Pancake API error: ${resp.status}`);
          const data = (await resp.json()) as any[];

          const top = data
            .filter((p) => Number(p?.volumeUSD24h ?? 0) > 0)
            .sort((a, b) => Number(b.volumeUSD24h ?? 0) - Number(a.volumeUSD24h ?? 0))
            .slice(0, WANT)
            .map<Row>((p) => ({
              id: `${chainId}:${getAddress(p.id)}`,
              lp: getAddress(p.id),
              chainId,
              token0: { address: getAddress(p.token0.id), symbol: String(p.token0.symbol || "T0"), logo: defaultLogo },
              token1: { address: getAddress(p.token1.id), symbol: String(p.token1.symbol || "T1"), logo: defaultLogo },
              tvlUSD: Number(p.tvlUSD ?? NaN),
              vol24hUSD: Number(p.volumeUSD24h ?? NaN),
              dex: "AironDex",
            }));

          setRows(top);
          setLoading(false);
          return;
        }

        
        if (!publicClient) throw new Error("Public client not ready");
        const factory = FACTORY_BY_CHAIN[chainId];
        if (!factory) throw new Error("Factory not configured for this chain.");

        const len = (await publicClient.readContract({
          address: factory,
          abi: FACTORY_MIN_ABI,
          functionName: "allPairsLength",
        })) as bigint;

        const total = Number(len || 0n);
        if (total === 0) {
          setLoading(false);
          return;
        }

        let pairAddrs: Address[] = [];
        const need = Math.min(WANT, total);
        for (let off = 0; off < need; off += BATCH) {
          const size = Math.min(BATCH, need - off);
          const calls = Array.from({ length: size }, (_, i) => {
            const idx = BigInt(total - 1 - (off + i));
            return { address: factory, abi: FACTORY_MIN_ABI, functionName: "allPairs" as const, args: [idx] };
          });
          const out = await runMulti(calls);
          out.forEach((r) => r.status === "success" && pairAddrs.push(getAddress(r.result as Address)));
        }

        if (pairAddrs.length === 0) {
          const scan = Math.min(SCAN_MAX, total);
          for (let i = 0; i < scan && pairAddrs.length < WANT; i++) {
            const idx = BigInt(total - 1 - i);
            try {
              const addr = (await publicClient.readContract({
                address: factory,
                abi: FACTORY_MIN_ABI,
                functionName: "allPairs",
                args: [idx],
              })) as Address;
              pairAddrs.push(getAddress(addr));
            } catch {}
          }
        }

        if (pairAddrs.length === 0) {
          setLoading(false);
          return;
        }
        if (pairAddrs.length > WANT) pairAddrs = pairAddrs.slice(0, WANT);

        type Seed = { lp: Address; t0?: Address; t1?: Address; s0?: string; s1?: string };
        const seeds: Seed[] = pairAddrs.map((lp) => ({ lp }));

        for (let i = 0; i < pairAddrs.length; i += BATCH) {
          const slice = pairAddrs.slice(i, i + BATCH);
          const tkCalls = slice.flatMap((addr) => [
            { address: addr, abi: [{ inputs: [], name: "token0", outputs: [{ type: "address" }], stateMutability: "view", type: "function" }] as const, functionName: "token0" as const },
            { address: addr, abi: [{ inputs: [], name: "token1", outputs: [{ type: "address" }], stateMutability: "view", type: "function" }] as const, functionName: "token1" as const },
          ]);
          const tkRes = await runMulti(tkCalls);
          for (let j = 0; j < slice.length; j++) {
            const b = j * 2;
            const idx = i + j;
            if (tkRes[b]?.status === "success") seeds[idx].t0 = getAddress(tkRes[b]!.result as Address);
            if (tkRes[b + 1]?.status === "success") seeds[idx].t1 = getAddress(tkRes[b + 1]!.result as Address);
          }
        }

        const metaCalls: any[] = [];
        seeds.forEach((s) => {
          if (s.t0 && s.t1) {
            metaCalls.push({ address: s.t0, abi: ERC20_ABI, functionName: "symbol" as const });
            metaCalls.push({ address: s.t1, abi: ERC20_ABI, functionName: "symbol" as const });
          }
        });
        const metaRes = metaCalls.length ? await runMulti(metaCalls) : [];
        let k = 0;
        seeds.forEach((s) => {
          if (s.t0 && s.t1) {
            s.s0 = metaRes[k]?.status === "success" ? String(metaRes[k].result) : "T0"; k++;
            s.s1 = metaRes[k]?.status === "success" ? String(metaRes[k].result) : "T1"; k++;
          }
        });

        const dexName = chainId === 2030 ? "AironDex" : "Factory";
        const list: Row[] = seeds
          .filter((s) => s.t0 && s.t1)
          .map((s) => ({
            id: `${chainId}:${s.lp}`,
            lp: s.lp,
            chainId,
            token0: { address: s.t0!, symbol: s.s0 || "T0", logo: defaultLogo },
            token1: { address: s.t1!, symbol: s.s1 || "T1", logo: defaultLogo },
            tvlUSD: null,
            vol24hUSD: null,
            dex: dexName,
          }));

        setRows(list);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [chainId, publicClient]);

  
  const pageData = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            `${r.token0.symbol}/${r.token1.symbol}`.toLowerCase().includes(q) ||
            r.token0.symbol.toLowerCase().includes(q) ||
            r.token1.symbol.toLowerCase().includes(q)
        )
      : rows.slice();
    return base.slice(0, WANT);
  }, [rows, query]);

  return (
    <div className="liq-wrap">
     
      <header className="liq-hero">
        <div className="crumbs"><b>Liquidity stats Airon DEX</b></div>
        <h1>Liquidity List</h1>
        <p>Snapshot of the most active pools across your current network.</p>
        <div className="hero-badges">
          <span className="badge green chain-badge">
            <TokenIcon src={CHAIN_META[chainId]?.logo || defaultLogo} alt={CHAIN_META[chainId]?.name || `Chain ${chainId}`} />
            <span>{CHAIN_META[chainId]?.name || `Chain ${chainId}`}</span>
          </span>
          <span className="badge blue">{gwei === "–" ? "Gas price —" : `Gas: ${gwei}`}</span>
        </div>
      </header>

     
      <section className="panel">
        <div className="card glass">
          <div className="card-head">
            <div className="ch-title">Liquidity Stats</div>
            <div className="ch-sub">
              {PANCAKE_API_BY_CHAIN[chainId]
                ? "Top 10 pools by 24h volume (0 volume excluded)."
                : chainId === 2030
                ? "Newest 10 pools on Airon (live from factory)."
                : "Newest 10 pools on this network (factory scan)."}
            </div>
          </div>

          <div className="ls-topbar">
            <div className="search mini">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <input
                placeholder="Search pool (e.g. WBNB / ANY)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!isConnected}
              />
            </div>
          </div>

         
          <div className="ls-scroll">
            <div className="ls-table">
              <div className="thead">
                <div className="th pool">Pool</div>
                <div className="th dex">Dex</div>
                <div className="th tvl">TVL</div>
                <div className="th vol">Volume 24h</div>
                <div className="th type">Pool Type</div>
              </div>

              {loading ? (
                <div className="tbody">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="tr sk" />)}
                </div>
              ) : error ? (
                <div className="empty">
                  <div className="title">Failed to load pools</div>
                  <div className="sub">{error}</div>
                </div>
              ) : pageData.length === 0 ? (
                <div className="empty">
                  <div className="title">No pools found</div>
                  <div className="sub">
                    {PANCAKE_API_BY_CHAIN[chainId] ? "All top pools have 0 volume today." : "Try another network or clear the search."}
                  </div>
                </div>
              ) : (
                <div className="tbody">
                  {pageData.map((p) => (
                    <div key={p.id} className="tr">
                      <div className="td pool">
                        <div className="pair">
                          <TokenIcon src={p.token0.logo || defaultLogo} alt={p.token0.symbol} />
                          <TokenIcon src={p.token1.logo || defaultLogo} alt={p.token1.symbol} />
                          <div className="meta">
                            <div className="sym">{p.token0.symbol} / {p.token1.symbol}</div>
                            <div className="chain">
                              <img src={CHAIN_META[p.chainId]?.logo || defaultLogo} alt="" />
                              <span>{CHAIN_META[p.chainId]?.name || p.chainId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="td dex">{p.dex}</div>
                      <div className="td tvl">{fmtUSD(p.tvlUSD)}</div>
                      <div className="td vol">{fmtUSD(p.vol24hUSD)}</div>
                      <div className="td type"><span className="chip">Liquidity</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
