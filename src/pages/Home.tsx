import "./Home.style.css";
import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc20Abi, formatUnits } from "viem";
import heroLogo from "../assets/home/icon.png";
import icoExchange   from "../assets/home/exchange.png";
import icoCrossChain from "../assets/home/crosschain.png";
import icoLiquidity  from "../assets/home/liquidity.png";
import icoAnalytics  from "../assets/home/analytics.png";
import iconAiron     from "../assets/chain/airon.png";
import iconArbitrum  from "../assets/chain/arbitrum.png";
import iconBase      from "../assets/chain/base.png";
import iconBnb       from "../assets/chain/bnb.png";
import iconEthereum  from "../assets/chain/ethereum.png";

type Net = { name: string; badge: "Mainnet" | "Testnet"; icon: string };
type GtTokenAttrs = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url?: string;
  normalized_total_supply?: string;
  market_cap_usd?: string | null;
  fdv_usd?: string | null;
  price_usd?: string | null;
};

type PriceConf = {
  key: "airon" | "bnb" | "eth" | "base" | "arb";
  name: string;
  icon: string;
  api: string;      
  chainId?: number; 
};

type TickerData = {
  key: string;
  name: string;
  icon: string;
  price: number | null;
  gwei: number | null;
};


const MAINNETS: Net[] = [
  { name: "BNB Chain", badge: "Mainnet", icon: iconBnb },
  { name: "Ethereum",  badge: "Mainnet", icon: iconEthereum },
  { name: "Base",      badge: "Mainnet", icon: iconBase },
  { name: "Arbitrum",  badge: "Mainnet", icon: iconArbitrum },
];
const TESTNETS: Net[] = [
  { name: "BNB Testnet",      badge: "Testnet", icon: iconBnb },
  { name: "Sepolia",          badge: "Testnet", icon: iconEthereum },
  { name: "Base Testnet",     badge: "Testnet", icon: iconBase },
  { name: "Arbitrum Testnet", badge: "Testnet", icon: iconArbitrum },
  { name: "Airon Testnet",    badge: "Testnet", icon: iconAiron },
];


const AIR_TOKEN: Address = "0x11c43293631a7c810918a10164016cee458ac64d";
const BURN_SINKS: Address[] = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000",
];
const AIR_GT_ENDPOINT =
  "https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0x11c43293631a7c810918a10164016cee458ac64d";


const fmtUSD = (n?: number | null) =>
  n == null || Number.isNaN(n) ? "—" :
  n < 1000 ? `$${n.toLocaleString()}` :
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtNum0 = (n?: number | null) =>
  n == null || Number.isNaN(n) ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const fmtPrice = (n?: number | null) =>
  n == null || Number.isNaN(n) ? "—" :
  n >= 1 ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
           `$${Number(n).toFixed(6)}`;


const fmtGwei = (g: number | null) =>
  g == null ? "— gwei"
  : g < 1    ? `${g.toFixed(3)} gwei`
  : g < 10   ? `${g.toFixed(1)} gwei`
             : `${Math.round(g)} gwei`;


export default function Home() {
  
  const publicClient = usePublicClient({ chainId: 56 });

  
  const [airMeta, setAirMeta] = useState<{
    name: string;
    symbol: string;
    image?: string;
    marketcap?: number | null;
    price?: number | null;
  } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [burned, setBurned] = useState<number | null>(null);
  const [supplyAfterBurn, setSupplyAfterBurn] = useState<number | null>(null);
  const [loadingBurn, setLoadingBurn] = useState(true);

  
  const TICKERS: PriceConf[] = [
    {
      key: "airon",
      name: "Airon Smartchain",
      icon: iconAiron,
      api: "https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0x11c43293631a7c810918a10164016cee458ac64d",
      chainId: 2030,
    },
    {
      key: "bnb",
      name: "BNB Chain",
      icon: iconBnb,
      api: "https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      chainId: 56,
    },
    {
      key: "eth",
      name: "Ethereum",
      icon: iconEthereum,
      api: "https://api.geckoterminal.com/api/v2/networks/eth/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      chainId: 1,
    },
    {
      key: "base",
      name: "Base",
      icon: iconBase,
      api: "https://api.geckoterminal.com/api/v2/networks/eth/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      chainId: 8453,
    },
    {
      key: "arb",
      name: "Arbitrum",
      icon: iconArbitrum,
      api: "https://api.geckoterminal.com/api/v2/networks/eth/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      chainId: 42161,
    },
  ];

  const [tickerRows, setTickerRows] = useState<TickerData[]>([]);
  const [tickLoading, setTickLoading] = useState(true);

  
  const pcAiron = usePublicClient({ chainId: 2030 });
  const pcBnb   = usePublicClient({ chainId: 56 });
  const pcEth   = usePublicClient({ chainId: 1 });
  const pcBase  = usePublicClient({ chainId: 8453 });
  const pcArb   = usePublicClient({ chainId: 42161 });

  

  
  useEffect(() => {
    const abort = new AbortController();

    const fetchPriceFromPoolFallback = async (): Promise<number | null> => {
      const POOL_ENDPOINT =
        "https://api.geckoterminal.com/api/v2/networks/bsc/tokens/0x11c43293631a7c810918a10164016cee458ac64d/pools?include=base_token,quote_token&limit=1";
      const res = await fetch(POOL_ENDPOINT, {
        signal: abort.signal,
        headers: { accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { data?: Array<{ attributes?: { token_price_usd?: string } }> };
      const first = json?.data?.[0]?.attributes;
      const v = first?.token_price_usd != null ? Number(first.token_price_usd) : null;
      return Number.isFinite(v ?? NaN) ? v : null;
    };

    (async () => {
      try {
        setLoadingMeta(true);

        const res = await fetch(AIR_GT_ENDPOINT, {
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as { data: { attributes: GtTokenAttrs } };
        const a = json?.data?.attributes;

        let price = a?.price_usd != null ? Number(a.price_usd) : null;
        if (price == null || Number.isNaN(price)) {
          try {
            const poolPrice = await fetchPriceFromPoolFallback();
            if (poolPrice != null) price = poolPrice;
          } catch {/* ignore errors */}
        }
        const mc = a?.market_cap_usd != null
          ? Number(a.market_cap_usd)
          : (a?.fdv_usd ? Number(a.fdv_usd) : null);

        setAirMeta({
          name: a?.name ?? "Airon Network",
          symbol: a?.symbol ?? "AIR",
          image: a?.image_url,
          marketcap: Number.isFinite(mc ?? NaN) ? mc : null,
          price: Number.isFinite(price ?? NaN) ? price : null,
        });
      } catch {
        setAirMeta({
          name: "Airon Network",
          symbol: "AIR",
          image: undefined,
          marketcap: null,
          price: null,
        });
      } finally {
        setLoadingMeta(false);
      }
    })();

    return () => abort.abort();
  }, []);

  
  useEffect(() => {
    (async () => {
      try {
        setLoadingBurn(true);
        if (!publicClient) throw new Error("No public client");

        const decimals = (await publicClient.readContract({
          address: AIR_TOKEN,
          abi: erc20Abi,
          functionName: "decimals",
        })) as number;

        const totalSupplyRaw = (await publicClient.readContract({
          address: AIR_TOKEN,
          abi: erc20Abi,
          functionName: "totalSupply",
        })) as bigint;

        let burnedTotalRaw = 0n;
        for (const sink of BURN_SINKS) {
          const bal = (await publicClient.readContract({
            address: AIR_TOKEN,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [sink],
          })) as bigint;
          burnedTotalRaw += bal ?? 0n;
        }

        const netSupplyRaw = totalSupplyRaw > burnedTotalRaw ? (totalSupplyRaw - burnedTotalRaw) : 0n;
        const burnedNum = Number(formatUnits(burnedTotalRaw, decimals));
        const netSupplyNum = Number(formatUnits(netSupplyRaw, decimals));

        setBurned(Number.isFinite(burnedNum) ? burnedNum : null);
        setSupplyAfterBurn(Number.isFinite(netSupplyNum) ? netSupplyNum : null);
      } catch {
        setBurned(null);
        setSupplyAfterBurn(null);
      } finally {
        setLoadingBurn(false);
      }
    })();
  }, [publicClient]);


  useEffect(() => {
    let alive = true;

    async function getGwei(cid?: number): Promise<number | null> {
      try {
        if (!cid) return null;
        const pc =
          cid === 2030 ? pcAiron :
          cid === 56   ? pcBnb   :
          cid === 1    ? pcEth   :
          cid === 8453 ? pcBase  :
          cid === 42161? pcArb   :
          undefined;
        if (!pc) return null;

        const wei = await pc.getGasPrice();
        const gweiFloat = Number(wei) / 1e9;

       
        if (!Number.isFinite(gweiFloat) || gweiFloat < 0.001) return null;

   
        return gweiFloat;
      } catch {
        return null;
      }
    }

    async function fetchOnce() {
      setTickLoading(true);
      try {
        const rows: TickerData[] = await Promise.all(
          TICKERS.map(async (t) => {
            let price: number | null = null;
            try {
              const r = await fetch(t.api, { headers: { accept: "application/json" } });
              if (r.ok) {
                const j = await r.json() as { data?: { attributes?: { price_usd?: string | null } } };
                const ps = j?.data?.attributes?.price_usd ?? null;
                price = ps != null ? Number(ps) : null;
              }
            } catch { /* ignore error */ }
            const gwei = await getGwei(t.chainId);
            return { key: t.key, name: t.name, icon: t.icon, price: Number.isFinite(price ?? NaN) ? price : null, gwei };
          })
        );
        if (alive) setTickerRows(rows);
      } finally {
        if (alive) setTickLoading(false);
      }
    }

    fetchOnce();
    const iv = setInterval(fetchOnce, 30_000);
    return () => { alive = false; clearInterval(iv); };
    
  }, [pcAiron, pcBnb, pcEth, pcBase, pcArb]);

  
  const trackRefChains = useRef<HTMLDivElement | null>(null);
  const scrollByCards = (dir: -1 | 1) => {
    const el = trackRefChains.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".home__chaincard");
    const step = card ? card.offsetWidth + 16 : 260;
    el.scrollBy({ left: dir * step * 3, behavior: "smooth" });
  };

 
  return (
    <div className="home">

      
      <section className="home__ticker" aria-label="Live chain prices">
        <div className="ticker__viewport">
          <div className={"ticker__track" + (tickLoading ? " is-loading" : "")}>
            {[...tickerRows, ...tickerRows].map((r, i) => (
              <div className="ticker__item" key={`${r.key}-${i}`}>
                <img src={r.icon} alt={r.name} className="ticker__icon" />
                <span className="ticker__name">{r.name}</span>
                <span className="ticker__sep">•</span>
                <span className="ticker__price">{fmtPrice(r.price)}</span>
                <span className="ticker__sep">•</span>
                <span className="ticker__gwei">{fmtGwei(r.gwei)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      <section className="home__hero container">
        <div className="home__copy">
          <div className="home__badge">Powered by Airon Network</div>
          <h1 className="home__title">
            The multichain venue by <span className="accent">AIRON</span>
          </h1>
          <p className="home__subtitle">
            <strong>Multichain AMM engineered for scale</strong> — robust routing, liquidity depth,
            consistent fills, and cost control across networks.
          </p>

          <div className="home__cta">
            <NavLink to="/swap" className="home__btn home__btn--primary">Launch App</NavLink>
            <NavLink to="/liquidity" className="home__btn home__btn--outline">Create a Pool</NavLink>
          </div>
        </div>

        <div className="home__art">
          <div className="home__orb" aria-hidden />
          <img src={heroLogo} alt="AIRON DEX" className="home__logo" />
          <div className="home__glow" aria-hidden />
        </div>
      </section>

      
      <section className="home__actions container">
        <div className="home__actioncard is-exchange">
          <div className="home__actionhead">
            <img src={icoExchange} alt="" className="home__actionicon" />
            <h3>Exchange</h3>
          </div>
          <p>Spot swaps with gas-aware routing and tight slippage control.</p>
          <NavLink to="/swap" className="home__actionbtn home__actionbtn--primary">
            Open Exchange
          </NavLink>
        </div>

        <div className="home__actioncard is-cross">
          <div className="home__actionhead">
            <img src={icoCrossChain} alt="" className="home__actionicon" />
            <h3>Cross-Chain</h3>
          </div>
          <p>Move value across networks with a unified settlement flow.</p>
          <a href="#" className="home__actionbtn home__actionbtn--primary" onClick={(e)=>e.preventDefault()}>
            Bridge (soon)
          </a>
        </div>

        <div className="home__actioncard is-liq">
          <div className="home__actionhead">
            <img src={icoLiquidity} alt="" className="home__actionicon" />
            <h3>Liquidity</h3>
          </div>
          <p>Provide liquidity and inspect pool depth and fees.</p>
          <NavLink to="/liquidity" className="home__actionbtn home__actionbtn--primary">
            Add Liquidity
          </NavLink>
        </div>

        <div className="home__actioncard is-analytics">
          <div className="home__actionhead">
            <img src={icoAnalytics} alt="" className="home__actionicon" />
            <h3>Stats / Analytics</h3>
          </div>
          <p>Pairs, volume, and fee analytics in one consistent view.</p>
          <NavLink to="/liquidity-stats" className="home__actionbtn home__actionbtn--primary">
            View Stats
          </NavLink>
        </div>
      </section>

     
      <section className="home__token container" aria-label="AIR token overview">
        <div className="home__token-card">
          <div className="home__token-head">
            <div className="home__token-left">
              <div className="home__token-iconwrap">
                {airMeta?.image ? (
                  <img src={airMeta.image} className="home__token-icon" alt="AIR" />
                ) : (
                  <div className="home__token-fallback">AIR</div>
                )}
              </div>
              <div className="home__token-title">
                <div className="home__token-name">{airMeta?.name ?? "Airon Network"}</div>
                <div className="home__token-symbol">({airMeta?.symbol ?? "AIR"})</div>
              </div>
            </div>
            <div className="home__token-right">
              {(loadingMeta || loadingBurn) && <span className="home__pill is-loading">Loading…</span>}
              {!loadingMeta && !loadingBurn && <span className="home__pill is-ok">Live</span>}
            </div>
          </div>

          <div className="home__token-grid">
            <div className="home__token-item">
              <div className="home__token-label">Name</div>
              <div className="home__token-value">{airMeta?.name ?? (loadingMeta ? "…" : "—")}</div>
            </div>

            <div className="home__token-item">
              <div className="home__token-label">Price</div>
              <div className="home__token-value">
                {loadingMeta ? "…" : fmtPrice(airMeta?.price ?? null)}
              </div>
            </div>

            <div className="home__token-item">
              <div className="home__token-label">Marketcap</div>
              <div className="home__token-value">
                {loadingMeta ? "…" : fmtUSD(airMeta?.marketcap ?? null)}
                {!loadingMeta && airMeta?.marketcap == null && (
                  <span className="home__token-hint"> (FDV used)</span>
                )}
              </div>
            </div>

            <div className="home__token-item">
              <div className="home__token-label">Supply</div>
              <div className="home__token-value">
                {loadingMeta || loadingBurn ? "…" : fmtNum0(supplyAfterBurn)}
                <span className="home__token-hint">
                  {loadingBurn ? "" : burned != null ? `AIR` : " • burn read failed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="home__chains container">
        <div className="home__chainshead">
          <h2 className="home__section-title">Supported Chains</h2>
          <div className="home__chainscontrols">
            <button className="home__chev" aria-label="Prev" onClick={() => scrollByCards(-1)}>‹</button>
            <button className="home__chev" aria-label="Next" onClick={() => scrollByCards(1)}>›</button>
          </div>
        </div>

        <div className="home__slider">
          <div className="home__track" ref={trackRefChains}>
            {[...MAINNETS, ...TESTNETS].map((n) => (
              <div key={n.name} className={"home__chaincard " + (n.badge === "Mainnet" ? "is-main" : "is-test")}>
                <div className="home__chainrow">
                  <img className="home__chainicon" src={n.icon} alt={n.name} />
                  <div className="home__chainname">{n.name}</div>
                </div>
                <span className={"home__chip " + (n.badge === "Mainnet" ? "is-main" : "is-test")}>{n.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="home__faq container" aria-label="FAQ - Airon DEX">
        <h2 className="home__section-title">FAQ</h2>
        <p className="home__faq-sub">Low fees. Fast multichain trades. Straight answers.</p>

        <div className="home__faqlist">
          <details className="home__faqitem">
            <summary>
              <span className="home__faq-q">What is Airon DEX?</span>
            </summary>
            <div className="home__faq-a">
              Airon DEX is a multichain AMM built for efficiency—<strong>low fees</strong>, <strong>fast execution</strong>, and
              smart routing across supported EVM networks.
            </div>
          </details>

          <details className="home__faqitem">
            <summary>
              <span className="home__faq-q">Which networks are supported?</span>
            </summary>
            <div className="home__faq-a">
              We start with BNB Chain and major EVM chains (Base, Arbitrum, Ethereum). The router selects optimal paths per chain
              for speed and cost.
            </div>
          </details>

          <details className="home__faqitem">
            <summary>
              <span className="home__faq-q">How low are the fees?</span>
            </summary>
            <div className="home__faq-a">
              Fees are designed to be <strong>as low as possible</strong> with tight slippage control. You keep more of each trade, even on
              cross-chain routes.
            </div>
          </details>

          <details className="home__faqitem">
            <summary>
              <span className="home__faq-q">How fast are trades?</span>
            </summary>
            <div className="home__faq-a">
              Settlement follows the target chain’s finality, but the execution pipeline is tuned for <strong>fast trades</strong> with minimal
              latency and robust fills.
            </div>
          </details>

          <details className="home__faqitem">
            <summary>
              <span className="home__faq-q">How do I provide liquidity (LP)?</span>
            </summary>
            <div className="home__faq-a">
              Choose a pool, add assets, and earn a share of fees. The UI surfaces pool depth, fees, and returns to help you allocate
              with confidence.
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
