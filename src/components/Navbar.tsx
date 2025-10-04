// src/components/Navbar.tsx
import "./Navbar.style.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
  usePublicClient,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, formatUnits, getAddress, type Address } from "viem";
import iconAiron from "../assets/chain/airon.png";
import iconArbitrum from "../assets/chain/arbitrum.png";
import iconBase from "../assets/chain/base.png";
import iconBnb from "../assets/chain/bnb.png";
import iconEthereum from "../assets/chain/ethereum.png";
import defaultTokenLogo from "../assets/token/default.png";
import aironLogo from "../assets/navbar/airondex-logo.png";
import { fetchPancakeBalances } from "../web3/pancake";


type ChainKey =
  | "bsc" | "eth" | "base" | "arb"
  | "bscTest" | "sepolia" | "baseTest" | "arbTest" | "airon";

type ChainOpt = { key: ChainKey; name: string; chainId: number; icon: string; badge: "Mainnet" | "Testnet" };

const CHAINS: ChainOpt[] = [
  { key: "bsc",     name: "BNB Chain",     chainId: 56,      icon: iconBnb,      badge: "Mainnet" },
  { key: "eth",     name: "Ethereum",      chainId: 1,       icon: iconEthereum, badge: "Mainnet" },
  { key: "base",    name: "Base",          chainId: 8453,    icon: iconBase,     badge: "Mainnet" },
  { key: "arb",     name: "Arbitrum",      chainId: 42161,   icon: iconArbitrum, badge: "Mainnet" },
  { key: "bscTest", name: "BNB Testnet",   chainId: 97,      icon: iconBnb,      badge: "Testnet" },
  { key: "sepolia", name: "Sepolia",       chainId: 11155111,icon: iconEthereum, badge: "Testnet" },
  { key: "baseTest",name: "Base Testnet",  chainId: 84532,   icon: iconBase,     badge: "Testnet" },
  { key: "arbTest", name: "Arbitrum Test", chainId: 421614,  icon: iconArbitrum, badge: "Testnet" },
  { key: "airon",   name: "Airon Testnet", chainId: 2030,    icon: iconAiron,    badge: "Testnet" },
];

const NATIVE_SYMBOL: Record<ChainKey, string> = {
  bsc: "BNB", eth: "ETH", base: "ETH", arb: "ETH",
  bscTest: "tBNB", sepolia: "ETH", baseTest: "ETH", arbTest: "ETH", airon: "AIR",
};


function shortAddr(addr?: `0x${string}`) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
function fmt4(x: string) {
  if (!x) return "0";
  const [i, d = ""] = x.split(".");
  const dd = d.slice(0, 8);
  const n = Number(dd ? `${i}.${dd}` : i);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
function hiddenKey(chainId: number, owner: string) {
  return `airon.hidden.${chainId}.${owner.toLowerCase()}`;
}
function loadHidden(chainId: number, owner: string): Set<string> {
  try {
    const raw = localStorage.getItem(hiddenKey(chainId, owner));
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr.map((a) => a.toLowerCase()));
  } catch { return new Set(); }
}
function saveHidden(chainId: number, owner: string, set: Set<string>) {
  localStorage.setItem(hiddenKey(chainId, owner), JSON.stringify(Array.from(set)));
}


const EXPLORER_BASE: Record<number, string> = {
  1: "https://etherscan.io",
  56: "https://bscscan.com",
  97: "https://testnet.bscscan.com",
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
  42161: "https://arbiscan.io",
  421614: "https://sepolia.arbiscan.io",
  11155111: "https://sepolia.etherscan.io",
  2030: "https://testnet.aironscan.com",
};
function tokenExplorerUrl(chainId: number | undefined, owner: string | undefined, token: Address) {
  const base = (chainId && EXPLORER_BASE[chainId]) ? EXPLORER_BASE[chainId] : "https://etherscan.io";
  const contract = getAddress(token);
  const wallet = owner ? owner : "";
  return `${base}/token/${contract}?a=${wallet}`;
}

type Detected = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  formatted: string;
  logo: string;
  isSpam?: boolean;
};

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashOpen,  setDashOpen]  = useState(false);


  const [liqOpen, setLiqOpen] = useState(false);
  const liqRef = useRef<HTMLDivElement>(null);


  const [liqMobileOpen, setLiqMobileOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();


  const { disconnectAsync } = useDisconnect();

  const publicClient = usePublicClient();
  const navigate = useNavigate();

  const [selected] = useState<ChainKey>(() => {
    const saved = localStorage.getItem("airon.selectedChain") as ChainKey | null;
    return saved ?? "base";
  });

  const loc = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const current = useMemo(
    () =>
      CHAINS.find((c) => c.chainId === chainId) ??
      CHAINS.find((c) => c.key === selected) ??
      CHAINS[0],
    [chainId, selected]
  );


  const { data: bal, isLoading: balLoading, isError: balError } = useBalance({
    address,
    chainId,
    query: { enabled: isConnected && !!address },
  });
  const selectedSymbol = current ? (current.key === "airon" ? "tAIR" : NATIVE_SYMBOL[current.key]) : "—";
  const nativeIcon = current?.icon ?? defaultTokenLogo;


  const [tokensAll, setTokensAll] = useState<Detected[] | null>(null);
  const [ercLoading, setErcLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);


  const [showHidden, setShowHidden] = useState(false);
  const [autoHideSpam, setAutoHideSpam] = useState(true);
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(() =>
    address && chainId ? loadHidden(chainId, address) : new Set()
  );

  useEffect(() => {
    if (address && chainId) setHiddenSet(loadHidden(chainId, address));
  }, [address, chainId]);


  useEffect(() => {
    setDrawerOpen(false);
    setDashOpen(false);
    setLiqOpen(false);
  }, [loc.pathname]);


  useEffect(() => {
    if (!isConnected) {
      setDashOpen(false);
      setDrawerOpen(false);
      setLiqOpen(false);
    }
  }, [isConnected]);


  async function handleDisconnect() {
    try {
      await disconnectAsync();
    } finally {
      
      setDashOpen(false);
      setDrawerOpen(false);
      setLiqOpen(false);
      
      navigate("/");
    }
  }

 
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!liqRef.current) return;
      if (!liqRef.current.contains(e.target as Node)) setLiqOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLiqOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

 
  useEffect(() => {
    if (!isConnected || !address || !chainId) { setTokensAll([]); return; }
    let cancelled = false;
    (async () => {
      setErcLoading(true); setNote(null);
      try {
        const { tokens } = await fetchPancakeBalances({ address });
        const onThisChain = tokens.filter((t) => !t.chainId || t.chainId === chainId);

        const prelim: Detected[] = onThisChain.map((t) => {
          let raw = 0n; try { raw = BigInt(t.balance || "0"); } catch {}
          const addrCk = getAddress(t.address) as Address;
          const decimals = typeof t.decimals === "number" && Number.isFinite(t.decimals) ? t.decimals : 18;
          const symbol = t.symbol || "TKN";
          const name = t.name || symbol;
          return {
            address: addrCk, name, symbol, decimals, balance: raw,
            formatted: fmt4(formatUnits(raw, decimals)),
            logo: t.logoURI || defaultTokenLogo, isSpam: t.isSpam,
          };
        });

        const nonZero = prelim.filter((d) => d.balance > 0n);

        const needMeta = nonZero.filter((d) => (d.symbol === "TKN" || d.name === "TKN" || d.decimals === 18));
        if (publicClient && needMeta.length > 0) {
          const calls = needMeta.flatMap((x) => ([
            { address: x.address, abi: erc20Abi, functionName: "decimals" as const },
            { address: x.address, abi: erc20Abi, functionName: "symbol"   as const },
            { address: x.address, abi: erc20Abi, functionName: "name"     as const },
          ]));
          const res = await publicClient.multicall({ contracts: calls as any, allowFailure: true });
          for (let i = 0; i < needMeta.length; i++) {
            const d = needMeta[i];
            const rDec = res[i*3 + 0], rSym = res[i*3 + 1], rNam = res[i*3 + 2];
            if (rDec?.status === "success") { const dv = Number(rDec.result as bigint); if (Number.isFinite(dv)) d.decimals = dv; }
            if (rSym?.status === "success") d.symbol = String(rSym.result) || d.symbol;
            if (rNam?.status === "success") d.name   = String(rNam.result) || d.name;
            d.formatted = fmt4(formatUnits(d.balance, d.decimals));
          }
        }

        nonZero.sort((a, b) => (a.balance === b.balance ? 0 : a.balance > b.balance ? -1 : 1));
        if (!cancelled) setTokensAll(nonZero);
      } catch (e: any) {
        if (!cancelled) { setTokensAll([]); setNote(String(e?.message || e)); }
      } finally {
        if (!cancelled) setErcLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isConnected, address, chainId, publicClient]);

  
  const [visibleList, hiddenList] = useMemo(() => {
    const all = tokensAll ?? [];
    const hidden = new Set(hiddenSet);
    const vis: Detected[] = [], hid: Detected[] = [];
    for (const t of all) {
      const flagged = hidden.has(t.address.toLowerCase()) || (autoHideSpam && t.isSpam === true);
      (flagged ? hid : vis).push(t);
    }
    return [vis, hid] as const;
  }, [tokensAll, hiddenSet, autoHideSpam]);

  function hideToken(addr: Address) {
    if (!address || !chainId) return;
    const s = new Set(hiddenSet); s.add(addr.toLowerCase()); setHiddenSet(s); saveHidden(chainId, address, s);
  }
  function unhideToken(addr: Address) {
    if (!address || !chainId) return;
    const s = new Set(hiddenSet); s.delete(addr.toLowerCase()); setHiddenSet(s); saveHidden(chainId, address, s);
  }
  function unhideAll() {
    if (!address || !chainId) return;
    const s = new Set<string>(); setHiddenSet(s); saveHidden(chainId, address, s);
  }

  const nativeRow = (
    <div className="asset-row">
      <img className="asset-logo" src={nativeIcon} alt="" />
      <div className="asset-info">
        <div className="asset-name">Native</div>
        <div className="asset-symbol">{selectedSymbol}</div>
      </div>
      <div className="asset-balance">
        {(() => {
          if (balLoading) return "Loading…";
          if (balError)   return "Error";
          return (
            <>
              <span className="asset-amt">{fmt4(bal?.formatted ?? "0")}</span>
              <span className="asset-sym">{bal?.symbol ?? selectedSymbol}</span>
            </>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
      <header className="navbar" ref={navRef}>
        <div className="navbar__inner">
          
          <NavLink to="/" className="navbar__brand" aria-label="Airon DEX Home">
            <img src={aironLogo} alt="Airon DEX" className="navbar__logo" />
          </NavLink>

          <nav className="navlinks">
            <NavLink to="/" end className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Home</NavLink>
            <NavLink to="/swap" className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Exchange</NavLink>

            
            <div ref={liqRef} className={"navgroup" + (liqOpen ? " open" : "")}>
              <button type="button" className="navgroup__btn" onClick={() => setLiqOpen(v => !v)} aria-expanded={liqOpen} aria-haspopup="menu">
                Liquidity Info
                <span className="chev">▾</span>
              </button>
              <div className={"navdropdown" + (liqOpen ? " show" : "")} role="menu">
                <NavLink to="/liquidity" className="dropitem" onClick={() => setLiqOpen(false)}>Add Liquidity</NavLink>
                <NavLink to="/ManageLiquidity" className="dropitem" onClick={() => setLiqOpen(false)}>Manage Liquidity</NavLink>
                <NavLink to="/LiquidityStats" className="dropitem" onClick={() => setLiqOpen(false)}>Liquidity Stats</NavLink>
              </div>
            </div>

            <NavLink to="/earn" className={({isActive}) => "navlink" + (isActive ? " active" : "")}>Earn</NavLink>
            <a
              href="#"
              className="navlink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bridge
            </a>
          </nav>

          <div className="nav-right">
            {isConnected && <button className="btn btn--dash" onClick={() => setDashOpen(true)}>Dashboard</button>}
            <div className="rk-header">
              <ConnectButton
                accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
                chainStatus={{ smallScreen: "icon",  largeScreen: "icon" }}
                showBalance={false}
              />
            </div>
            <button className="btn mobile-toggle" onClick={() => setDrawerOpen(true)}>MENU</button>
          </div>
        </div>
      </header>

      <div className="nav-spacer" aria-hidden="true" />

      <div className={"dashdrop " + (dashOpen ? "show" : "")} onClick={() => setDashOpen(false)} />

      <aside className={"dashboard " + (dashOpen ? "open" : "")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard__head">
          <div className="dashboard__title">Dashboard</div>
          <button className="icon-btn" onClick={() => setDashOpen(false)}>✕</button>
        </div>

        <div className="dashboard__body">
          
          <div className="db-card">
            <div className="db-label">Wallet</div>
            <div className="db-value">{shortAddr(address)}</div>
          </div>

          
          <div className="db-card">
            <div className="db-label">Network</div>
            <div className="db-value">
              {chainId ? (CHAINS.find(c => c.chainId === chainId)?.name ?? `Chain ${chainId}`) : "—"}
            </div>
          </div>

          
          <div className="db-card">
            <div className="db-label">Assets</div>

            {nativeRow}

            
            <div style={{display:"flex", gap:8, alignItems:"center", margin:"12px 2px", flexWrap:"wrap"}}>
              <label style={{display:"flex", gap:6, alignItems:"center", cursor:"pointer"}}>
                <input type="checkbox" checked={autoHideSpam} onChange={(e) => setAutoHideSpam(e.target.checked)} />
                <span>Auto-hide spam</span>
              </label>
              <label style={{display:"flex", gap:6, alignItems:"center", cursor:"pointer"}}>
                <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
                <span>Show hidden ({hiddenList.length})</span>
              </label>
              {hiddenList.length > 0 && (
                <button className="btn btn--ghost" onClick={unhideAll}>Unhide all</button>
              )}
            </div>

            
            <div className="asset-list">
              {ercLoading && <div className="asset-hint">Scanning tokens…</div>}
              {!ercLoading && (visibleList.length ?? 0) === 0 && (
                <div className="asset-hint">
                  No ERC-20 balance detected.{note ? <div style={{opacity:.7, marginTop:6}}>({note})</div> : null}
                </div>
              )}
              {visibleList.map((t) => (
                <div className="asset-row" key={`v-${t.address}`}>
                  <img
                    className="asset-logo"
                    src={t.logo || defaultTokenLogo}
                    alt=""
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultTokenLogo; }}
                  />
                  <div className="asset-info">
                    <div className="asset-name">
                      <a
                        href={tokenExplorerUrl(chainId, address, t.address)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open in block explorer"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {t.name}
                      </a>
                    </div>
                    <div className="asset-symbol">
                      {t.symbol}{t.isSpam ? <span className="badge" style={{marginLeft:6}}>spam?</span> : null}
                    </div>
                  </div>
                  <div className="asset-balance">
                    <span className="asset-amt">{t.formatted}</span>
                    <span className="asset-sym">{t.symbol}</span>
                  </div>
                  <div>
                    <button className="btn btn--ghost" onClick={() => hideToken(t.address)}>Hide</button>
                  </div>
                </div>
              ))}
            </div>

            
            {showHidden && hiddenList.length > 0 && (
              <div style={{marginTop:16}}>
                <div className="db-label" style={{opacity:.85}}>Hidden ({hiddenList.length})</div>
                <div className="asset-list">
                  {hiddenList.map((t) => (
                    <div className="asset-row" key={`h-${t.address}`} style={{opacity:.6}}>
                      <img
                        className="asset-logo"
                        src={t.logo || defaultTokenLogo}
                        alt=""
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultTokenLogo; }}
                      />
                      <div className="asset-info">
                        <div className="asset-name">
                          <a
                            href={tokenExplorerUrl(chainId, address, t.address)}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in block explorer"
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            {t.name}
                          </a>
                        </div>
                        <div className="asset-symbol">
                          {t.symbol}{t.isSpam ? <span className="badge" style={{marginLeft:6}}>spam</span> : null}
                        </div>
                      </div>
                      <div className="asset-balance">
                        <span className="asset-amt">{t.formatted}</span>
                        <span className="asset-sym">{t.symbol}</span>
                      </div>
                      <div>
                        <button className="btn btn--ghost" onClick={() => unhideToken(t.address)}>Unhide</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="db-hint"></div>
          </div>
        </div>

        <div className="dashboard__footer">
          <button className="btn btn--danger" onClick={handleDisconnect}>Disconnect</button>
          <button className="btn btn--ghost" onClick={() => setDashOpen(false)}>Close</button>
        </div>
      </aside>

     
      <div className={"backdrop " + (drawerOpen ? "backdrop--show" : "")} onClick={() => setDrawerOpen(false)} />
      <aside className={"drawer " + (drawerOpen ? "drawer--open" : "")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__head">
          
          <div className="drawer__brand" aria-label="Airon DEX">
            <img src={aironLogo} alt="Airon DEX" className="drawer__logo" />
          </div>
          <button className="icon-btn" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        <div className="drawer__body">
          <div className="drawer__title">Network</div>
          <ConnectButton.Custom>
            {({ openChainModal, openConnectModal, mounted, account, chain }) => {
              const ready = mounted, connected = ready && !!account;
              if (!connected) {
                return (
                  <button className="network-btn" onClick={openConnectModal}>
                    <span className="network-icon-placeholder" />
                    <span>Connect wallet to choose network</span>
                  </button>
                );
              }
              return (
                <button className="network-btn" onClick={openChainModal}>
                  {chain?.iconUrl ? <img className="network-icon" src={chain.iconUrl} alt="" /> : <span className="network-icon-placeholder" />}
                  <span>{chain?.name ?? "Select Network"}</span>
                </button>
              );
            }}
          </ConnectButton.Custom>

          <div className="drawer__title">Navigation</div>
          <NavLink to="/" end className="drawer__item"><span>Home</span></NavLink>
          <NavLink to="/swap" className="drawer__item"><span>Exchange</span></NavLink>

          
          <button
            className={"drawer__item drawer__item--group" + (liqMobileOpen ? " on" : "")}
            onClick={() => setLiqMobileOpen(v => !v)}
            aria-expanded={liqMobileOpen}
          >
            <span>Liquidity Info</span>
            <div className="drawer__right">
              <span className={"drawer__chev" + (liqMobileOpen ? " rot" : "")}>▾</span>
            </div>
          </button>
          <div className={"drawer__sub " + (liqMobileOpen ? "show" : "")}>
            <NavLink to="/liquidity" className="drawer__subitem" onClick={() => { setDrawerOpen(false); setLiqMobileOpen(false); }}>Add Liquidity</NavLink>
            <NavLink to="/ManageLiquidity" className="drawer__subitem" onClick={() => { setDrawerOpen(false); setLiqMobileOpen(false); }}>Manage Liquidity</NavLink>
            <NavLink to="/LiquidityStats" className="drawer__subitem" onClick={() => { setDrawerOpen(false); setLiqMobileOpen(false); }}>Liquidity Stats</NavLink>
          </div>

          <NavLink to="/earn" className="drawer__item"><span>Earn</span><span className="badge">Coming Soon</span></NavLink>
          <a
            href="#"
            className="drawer__item"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bridge
          </a>
        </div>

        <div className="drawer__footer">
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                className="drawer__connect"
                onClick={() => {
                  if (isConnected) {
                    setDashOpen(true);
                    setDrawerOpen(false);
                  } else {
                    openConnectModal();
                  }
                }}
              >
                {isConnected ? "Open Dashboard" : "Connect"}
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
export { Navbar };
