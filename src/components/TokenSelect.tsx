// src/components/TokenSelect.tsx
import { useEffect, useMemo, useState } from "react";
import { useTokens } from "../hooks/useTokens";
import TokenIcon from "./TokenIcon";
import type { Address } from "viem";
import "./TokenSelect.css";


import { useAccount } from "wagmi";
import { useTokenBalances } from "../hooks/useTokenBalances";


import { useAddressToken } from "../hooks/useAddressToken";


import {
  upsertCustomToken,
  listCustomTokens,
  removeCustomToken,
  onCustomTokensUpdated,
} from "../lib/customTokens";


import logoBNB from "../assets/chain/bnb.png";
import logoETH from "../assets/chain/ethereum.png";
import logoARB from "../assets/chain/arbitrum.png";
import logoBASE from "../assets/chain/base.png";
import logoAIRON from "../assets/chain/airon.png";

import tAIR from "../assets/token/airon.png";
import tUSDT from "../assets/token/usdt.png";
import tUSDC from "../assets/token/usdc.png";
import tWETH from "../assets/token/weth.png";
import tARB from "../assets/token/arbitrum.png";


import defaultLogo from "../assets/token/default.png";
import warnIcon from "../assets/swap/warning.png";
import removeIcon from "../assets/swap/remove.png";

type ChainMeta = { id: number; key: string; name: string; native: string; logo: string };
const CHAINS: ChainMeta[] = [
  { id: 56, key: "bsc",  name: "BNB Chain",  native: "BNB", logo: logoBNB },
  { id: 1,  key: "eth",  name: "Ethereum",   native: "ETH", logo: logoETH },
  { id: 42161, key: "arb", name: "Arbitrum", native: "ETH", logo: logoARB },
  { id: 8453, key: "base", name: "Base",     native: "ETH", logo: logoBASE },
  { id: 97, key: "bscTest", name: "BNB Testnet",   native: "tBNB",       logo: logoBNB },
  { id: 11155111, key: "sepolia", name: "ETH Sepolia", native: "ETH Sepolia", logo: logoETH },
  { id: 421614, key: "arbTest", name: "ARB Testnet",   native: "ETH Sepolia", logo: logoARB },
  { id: 84532, key: "baseTest", name: "Base Testnet",  native: "ETH Sepolia", logo: logoBASE },
  { id: 2030, key: "airon", name: "Airon Testnet",     native: "tAIR",        logo: logoAIRON },
];

const MAINNET_IDS = new Set([56, 1, 42161, 8453]);
const TESTNET_IDS  = new Set([97, 11155111, 421614, 84532, 2030]);

type Pop = { address: Address | "native"; symbol: string; name?: string; logo?: string };
const POPULAR: Record<number, Pop[]> = {
  56: [
    { address: "native", symbol: "BNB", name: "BNB (Native)", logo: logoBNB },
    { address: "0x11c43293631a7c810918a10164016cee458ac64d" as Address, symbol: "AIR",  name: "AIR COIN",   logo: tAIR  },
    { address: "0x55d398326f99059fF775485246999027B3197955" as Address, symbol: "USDT", name: "Tether USD", logo: tUSDT },
    { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address, symbol: "USDC", name: "USD Coin",   logo: tUSDC },
  ],
  1: [
    { address: "native", symbol: "ETH",  name: "Ether (Native)", logo: logoETH },
    { address: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2" as Address, symbol: "WETH", name: "Wrapped Ether", logo: tWETH },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address, symbol: "USDC", name: "USD Coin",       logo: tUSDC },
  ],
  42161: [
    { address: "native", symbol: "ETH", name: "Ether (Arbitrum Native)", logo: logoARB },
    { address: "0x912CE59144191C1204E64559FE8253a0e49E6548" as Address, symbol: "ARB",  name: "Arbitrum",      logo: tARB  },
    { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address, symbol: "USDC", name: "USD Coin",      logo: tUSDC },
  ],
  8453: [
    { address: "native", symbol: "ETH",  name: "Ether (Base Native)", logo: logoBASE },
    { address: "0x4200000000000000000000000000000000000006" as Address, symbol: "WETH", name: "Wrapped Ether", logo: tWETH },
    { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, symbol: "USDC", name: "USD Coin",       logo: tUSDC },
  ],
  97: [
    { address: "native", symbol: "tBNB", name: "BNB Testnet", logo: logoBNB },
    { address: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as Address, symbol: "WBNB", name: "Wrapped BNB", logo: logoBNB },
    { address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as Address, symbol: "USDT", name: "USDT Coin",     logo: tUSDT },
  ],
  11155111: [
    { address: "native", symbol: "ETH Sepolia", name: "Ether Sepolia", logo: logoETH },
    { address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as Address, symbol: "WETH", name: "Wrapped Ether", logo: tWETH },
    { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address, symbol: "USDC", name: "USD Coin",       logo: tUSDC },
  ],
  421614: [
    { address: "native", symbol: "ETH Sepolia", name: "Arbitrum Sepolia Ether", logo: logoETH },
    { address: "0x1bdc540dEB9Ed1fA29964DeEcCc524A8f5e2198e" as Address, symbol: "WETH", name: "Wrapped Ether", logo: tWETH },
    { address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as Address, symbol: "USDC", name: "USD Coin",       logo: tUSDC },
  ],
  84532: [
    { address: "native", symbol: "ETH Sepolia", name: "Base Sepolia Ether", logo: logoETH },
    { address: "0x4200000000000000000000000000000000000006" as Address, symbol: "WETH", name: "Wrapped Ether", logo: tWETH },
    { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address, symbol: "USDC", name: "USD Coin",       logo: tUSDC },
  ],
  2030: [
    { address: "native", symbol: "tAIR", name: "Airon Testnet", logo: logoAIRON },
    { address: "0x11C43293631a7c810918A10164016cEe458ac64D" as Address, symbol: "WAIR", name: "Wrapped AIR", logo: tAIR },
    { address: "0xcfaFE77e52A5345D9D9a5A492dc0571feB71D08a" as Address, symbol: "USDC", name: "USD Coin",     logo: tUSDC },
    { address: "0x2C7a93b3e62750F5FfE2e7CACcb7eDd0E6Eb1d48" as Address, symbol: "USDT", name: "USDT Coin",     logo: tUSDT },
  ],
};

export default function TokenSelect({
  side,
  connectedChainId,
  initialChainId,
  onPick,
  onClose,
}: {
  side: "from" | "to";
  connectedChainId: number;
  initialChainId?: number;
  onPick: (t: { chainId: number; address: Address | "native"; symbol: string; name?: string; logo: string }) => void;
  onClose: () => void;
}) {
  const { address: account } = useAccount();

  
  const autoTestnet = TESTNET_IDS.has(connectedChainId);
  const [testnetMode, setTestnetMode] = useState<boolean>(autoTestnet);
  useEffect(() => setTestnetMode(TESTNET_IDS.has(connectedChainId)), [connectedChainId]);

  const visibleChains = useMemo(
    () => CHAINS.filter((c) => (testnetMode ? TESTNET_IDS.has(c.id) : MAINNET_IDS.has(c.id))),
    [testnetMode]
  );

  
  const defaultChain = side === "from" ? connectedChainId : (initialChainId ?? connectedChainId);
  const [activeChainId, setActiveChainId] = useState<number>(defaultChain);

  useEffect(() => {
    const inMode = testnetMode ? TESTNET_IDS.has(activeChainId) : MAINNET_IDS.has(activeChainId);
    if (!inMode) {
      const candidate =
        (testnetMode && TESTNET_IDS.has(connectedChainId)) || (!testnetMode && MAINNET_IDS.has(connectedChainId))
          ? connectedChainId
          : (visibleChains[0]?.id ?? defaultChain);
      setActiveChainId(candidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testnetMode, connectedChainId, visibleChains]);

  const lockNetwork = side === "from";
  useEffect(() => {
    if (lockNetwork) setActiveChainId(defaultChain);
  }, [lockNetwork, defaultChain]);

  const [q, setQ] = useState("");
  const [manage, setManage] = useState(false);

  const { loading, tokens } = useTokens(activeChainId, q, account);

  const popularSet = useMemo(() => {
    const set = new Set<string>();
    (POPULAR[activeChainId] || []).forEach((t) => {
      if (t.address !== "native") set.add((t.address as string).toLowerCase());
    });
    return set;
  }, [activeChainId]);

const allTokens = useMemo(() => {
  const arr = tokens ?? [];
  
  const filtered = arr.filter(
    (t) => !popularSet.has((t.address as string).toLowerCase())
  );
  
  return filtered.length ? filtered : arr;
}, [tokens, popularSet]);

  const chainMeta = CHAINS.find((c) => c.id === activeChainId) || CHAINS[0];

  const pick = (p: { address: Address | "native"; symbol: string; name?: string; logo?: string }) => {
    onPick({
      chainId: activeChainId,
      address: p.address,
      symbol: p.symbol,
      name: p.name,
      logo: p.logo ?? (p.address === "native" ? chainMeta.logo : defaultLogo),
    });
  };

 
  const tokenDefs = useMemo(
    () => allTokens.map(t => ({ address: t.address as Address, decimals: t.decimals ?? 18 })),
    [allTokens]
  );
  const { get: getBal } = useTokenBalances(activeChainId, account as Address | undefined, tokenDefs);

  const sortedAll = useMemo(() => {
    const withBal = allTokens.map(t => {
      const b = getBal(t.address as Address);
      return { t, raw: (b?.raw ?? 0n) as bigint, fmt: b?.formatted ?? "0" };
    });
    withBal.sort((A,B) => {
      const aNZ = A.raw > 0n ? 1 : 0, bNZ = B.raw > 0n ? 1 : 0;
      if (bNZ !== aNZ) return bNZ - aNZ;
      if (A.raw !== B.raw) return B.raw > A.raw ? 1 : -1;
      return A.t.symbol.localeCompare(B.t.symbol);
    });
    return withBal;
  }, [allTokens, getBal]);

 
  const { loading: addrLoading, token: addrToken, isAddressQuery } = useAddressToken(activeChainId, q);
  const showingAddressResult = isAddressQuery && (addrLoading || addrToken);

 
  const [customRev, setCustomRev] = useState(0);
  useEffect(() => onCustomTokensUpdated(() => setCustomRev(v => v + 1)), []);
  const userAdded = useMemo(() => {
    if (!account) return [];
    return listCustomTokens(activeChainId, account);
  }, [activeChainId, account, customRev]);
  const hasUserAdded = userAdded.length > 0;

  
  const [confirmAdd, setConfirmAdd] = useState<null | {
    address: Address; symbol: string; name: string; decimals: number; logoResolved?: string;
  }>(null);
  const confirmPick = () => {
    if (!confirmAdd) return;
    upsertCustomToken({
      chainId: activeChainId,
      address: confirmAdd.address,
      symbol: confirmAdd.symbol,
      name: confirmAdd.name,
      decimals: confirmAdd.decimals,
      logoURI: confirmAdd.logoResolved || defaultLogo,
    }, account);
    pick({
      address: confirmAdd.address,
      symbol: confirmAdd.symbol,
      name: confirmAdd.name,
      logo: confirmAdd.logoResolved || defaultLogo,
    });
    setConfirmAdd(null);
  };

  
  const [confirmRemove, setConfirmRemove] = useState<null | { address: Address; symbol: string }>(null);
  const doRemove = () => {
    if (!confirmRemove) return;
    removeCustomToken(activeChainId, confirmRemove.address, account);
    setConfirmRemove(null);
  };

  return (
    <div className="tkselect-modal" role="dialog" aria-modal="true" aria-label="Select a token">
      <div className="tkselect-head">
        <div className="tkselect-title">Select a token</div>
        <button className="tkselect-x" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="tkselect-content">
        
        <div className="mode-row">
          <div className="mode-label">Mode</div>
          <div className="mode-switch" role="tablist" aria-label="Network mode">
            <button
              role="tab"
              aria-selected={!testnetMode}
              className={"switch-pill " + (!testnetMode ? "on" : "")}
              onClick={() => setTestnetMode(false)}
              disabled={lockNetwork && TESTNET_IDS.has(connectedChainId)}
              title="Show mainnet chains/tokens"
            >
              Mainnet
            </button>
            <button
              role="tab"
              aria-selected={testnetMode}
              className={"switch-pill " + (testnetMode ? "on" : "")}
              onClick={() => setTestnetMode(true)}
              disabled={lockNetwork && MAINNET_IDS.has(connectedChainId)}
              title="Show testnet chains/tokens"
            >
              Testnet
            </button>
          </div>
        </div>

       
        <div className="net-wrap">
          <div className="net-title">Network</div>
          <div className="netchips" role="tablist" aria-label="Networks">
            {visibleChains.map((c) => {
              const disabled = lockNetwork && c.id !== connectedChainId;
              const isOn = activeChainId === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={isOn}
                  className={"chip " + (isOn ? "on " : "") + (disabled ? "disabled" : "")}
                  onClick={() => { if (!disabled) setActiveChainId(c.id); }}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  title={disabled ? "From network follows your connected wallet" : c.name}
                >
                  <TokenIcon src={c.logo} alt={c.name} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="tksearch-wrap">
          <input
            className="tksearch"
            placeholder="Search name or paste address"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

       
        {q.trim() === "" && (
          <div className="popular-block">
            <div className="sec-title">Popular tokens {CHAINS.find(c=>c.id===activeChainId)?.name || "Network"}</div>
            <div className="popular-grid">
              {(POPULAR[activeChainId] || []).map((t) => (
                <button
                  key={`${activeChainId}-${t.address}-${t.symbol}`}
                  className="popitem"
                  onClick={() =>
                    pick({
                      address: t.address as Address | "native",
                      symbol: t.symbol,
                      name: t.name,
                      logo: t.logo ?? (t.address === "native" ? (CHAINS.find(c=>c.id===activeChainId)?.logo||defaultLogo) : defaultLogo),
                    })
                  }
                >
                  <div className="popicon">
                    <TokenIcon
                      src={t.address === "native"
                        ? (CHAINS.find(c=>c.id===activeChainId)?.logo || defaultLogo)
                        : t.logo || defaultLogo}
                      alt={t.symbol}
                    />
                  </div>
                  <div className="poptxt">
                    <div className="sym">{t.symbol}</div>
                    <div className="sub">{t.name || ""}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

       
        {q.trim() === "" && account && hasUserAdded && (
          <div className="popular-block">
            <div className="sec-title with-manage">
              <span>Added by you</span>
              <button className="manage-btn" onClick={() => setManage(v => !v)}>
                {manage ? "Done" : "Manage"}
              </button>
            </div>
            <div className="popular-grid">
              {userAdded.map((t) => (
                <div key={`${t.chainId}-${t.address}`} className="popitem manageable">
                  <div className="popicon">
                    <TokenIcon src={t.logoURI || defaultLogo} alt={t.symbol} />
                  </div>
                  <div className="poptxt">
                    <div className="sym">
                      {t.symbol}
                      <span className="tag">custom</span>
                    </div>
                    <div className="sub">{t.name}</div>
                  </div>
                  {manage ? (
                    <button
                      className="trash"
                      title="Remove from your list"
                      onClick={() => setConfirmRemove({ address: t.address as Address, symbol: t.symbol })}
                    >
                      <img src={removeIcon} alt="" />
                    </button>
                  ) : (
                    <button
                      className="addpill"
                      onClick={() =>
                        pick({ address: t.address as Address, symbol: t.symbol, name: t.name, logo: t.logoURI || defaultLogo })
                      }
                    >
                      Select
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

       
        <div className="tklist">
          <div className="sec-title">{showingAddressResult ? "Search result" : "All tokens"}</div>

          {showingAddressResult ? (
            <>
              {addrLoading && <div className="dim">Fetching token…</div>}
              {!addrLoading && !addrToken && <div className="dim">No token found on this network</div>}
              {!addrLoading && addrToken && (
                <button
                  className="tkitem"
                  onClick={() =>
                    setConfirmAdd({
                      address: addrToken.address as Address,
                      symbol: addrToken.symbol,
                      name: addrToken.name,
                      decimals: addrToken.decimals,
                      logoResolved: (addrToken as any).logoResolved,
                    })
                  }
                >
                  <TokenIcon src={(addrToken as any).logoResolved || defaultLogo} alt={addrToken.symbol} />
                  <div className="tktxt">
                    <div className="sym">{addrToken.symbol}</div>
                    <div className="sub">{addrToken.name}</div>
                  </div>
                  <div className="addpill">Add</div>
                </button>
              )}
            </>
          ) : (
            <>
              {loading && <div className="dim">Loading…</div>}
              {!loading && sortedAll.length === 0 && <div className="dim">No tokens</div>}
              {!loading &&
                sortedAll.map(({ t, raw, fmt }) => {
                  const zero = raw === 0n;
                  return (
                    <button
                      key={`${t.chainId}-${t.address}`}
                      className="tkitem"
                      onClick={() =>
                        pick({
                          address: t.address as Address,
                          symbol: t.symbol,
                          name: t.name,
                          logo: (t as any).logoResolved || defaultLogo,
                        })
                      }
                    >
                      <TokenIcon src={(t as any).logoResolved || defaultLogo} alt={t.symbol} />
                      <div className="tktxt">
                        <div className="sym">{t.symbol}</div>
                        <div className="sub">{t.name}</div>
                      </div>
                      <div className={"bval " + (zero ? "zero" : "")}>{fmt}</div>
                    </button>
                  );
                })}
            </>
          )}
        </div>
      </div>

      
      {confirmAdd && (
        <>
          <div className="warn-backdrop" onClick={() => setConfirmAdd(null)} />
          <div className="warn-modal" role="dialog" aria-modal="true" aria-label="Confirm manual token add">
            <div className="warn-head">
              <img src={warnIcon} alt="" />
              <div>
                <div className="warn-title">Add token manually</div>
                <div className="warn-sub">Make sure you trust this token’s contract address.</div>
              </div>
            </div>

            <div className="warn-token">
              <TokenIcon src={confirmAdd.logoResolved || defaultLogo} alt={confirmAdd.symbol} />
              <div className="wtxt">
                <b>{confirmAdd.symbol}</b>
                <span>{confirmAdd.address}</span>
              </div>
            </div>

            <div className="warn-note">
              You’re about to add a custom token. Anyone can create a token with any name, including fake versions of
              existing tokens. Double-check the contract address and proceed at your own risk.
            </div>

            <div className="warn-actions">
              <button className="airon-btn ghost" onClick={() => setConfirmAdd(null)}>Cancel</button>
              <button className="airon-btn primary" onClick={confirmPick}>I understand</button>
            </div>
          </div>
        </>
      )}

     
      {confirmRemove && (
        <div className="add-confirm-backdrop" onClick={() => setConfirmRemove(null)}>
          <div className="add-confirm" onClick={(e)=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Remove custom token">
            <img className="warn-ic" src={removeIcon} alt="" />
            <h3>Remove token from your list?</h3>
            <p>
              You’re about to hide <b>{confirmRemove.symbol}</b> from your token list. This will <b>not</b> affect your
              assets or balances — it only removes the token from this list for your account. You can add it again later.
            </p>
            <div className="row-btns">
              <button className="ghost" onClick={() => setConfirmRemove(null)}>No</button>
              <button className="primary" onClick={doRemove}>Yes, remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
