import { useEffect, useMemo, useState, memo, type ReactNode } from "react";
import "./Liquidity.css";
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useWalletClient,
  useBlockNumber,
} from "wagmi";
import {
  parseUnits,
  formatUnits,
  maxUint256,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";


import TokenSelect from "../components/TokenSelect";
import TokenIcon from "../components/TokenIcon";
import defaultLogo from "../assets/token/default.png";


import slippageIcon from "../assets/liquidity/slippage.png";
import mevIcon from "../assets/liquidity/mev.png";
import plusIcon from "../assets/liquidity/plus.png";


import confirmedIcon from "../assets/liquidity/confirmed.png";


import bnbLogo from "../assets/chain/bnb.png";
import ethLogo from "../assets/chain/ethereum.png";
import arbLogo from "../assets/chain/arbitrum.png";
import baseLogo from "../assets/chain/base.png";
import sepoliaLogo from "../assets/chain/ethereum.png";
import bnbtLogo from "../assets/chain/bnb.png";
import arbTestLogo from "../assets/chain/arbitrum.png";
import baseTestLogo from "../assets/chain/base.png";
import aironLogo from "../assets/chain/airon.png";


import {
  ERC20_ABI,
  ROUTER_V2_ABI,
  FACTORY_V2_ABI,
  PAIR_V2_ABI,
} from "../abis/liquidity";

type DexConfig = { router?: Address; factory?: Address; wnative?: Address };
const DEX: Record<number, DexConfig> = {
  56: {
    router: "0x10ED43C718714eb63d5aA57B78B54704E256024E" as Address,
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73" as Address,
    wnative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address,
  },
  1: {
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" as Address,
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f" as Address,
    wnative: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" as Address,
  },
  8453: {
    router: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb" as Address,
    factory: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E" as Address,
    wnative: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as Address,
  },
  42161: {
    router: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb" as Address,
    factory: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E" as Address,
    wnative: "0x4200000000000000000000000000000000000006" as Address,
  },

  97: {
    router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1" as Address,
    factory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17" as Address,
    wnative: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as Address,
  },
  11155111: {
    router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3" as Address,
    factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6" as Address,
    wnative: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as Address,
  },
  421614: {
    router: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb" as Address,
    factory: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E" as Address,
    wnative: "0x1bdc540dEB9Ed1fA29964DeEcCc524A8f5e2198e" as Address,
  },
  84532: {
    router: "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb" as Address,
    factory: "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E" as Address,
    wnative: "0x4200000000000000000000000000000000000006" as Address,
  },
  2030: {
    router: "0x224cd6F72660fE1eFA650255a2bCa9670b4d38c1" as Address,
    factory: "0xA65CB0c559aA59dcB40e256A2DBAAa403181Bd11" as Address,
    wnative: "0x11C43293631a7c810918A10164016cEe458ac64D" as Address,
  },
};


const NATIVE: Record<number, { symbol: string; logo: string }> = {
  56: { symbol: "BNB", logo: bnbLogo },
  1: { symbol: "ETH", logo: ethLogo },
  8453: { symbol: "ETH", logo: baseLogo },
  42161: { symbol: "ETH", logo: arbLogo },
  97: { symbol: "tBNB", logo: bnbtLogo },
  11155111: { symbol: "ETH Sepolia", logo: sepoliaLogo },
  421614: { symbol: "ETH Sepolia", logo: arbTestLogo },
  84532: { symbol: "ETH Sepolia", logo: baseTestLogo },
  2030: { symbol: "tAIR", logo: aironLogo },
};


type SelToken = {
  chainId: number;
  address: Address | "native";
  symbol: string;
  name?: string;
  logo: string;
};

type Position = {
  id: string;
  chainId: number;
  tokenA: SelToken;
  tokenB: SelToken;
  amountA: string;
  amountB: string;
  lpShares: string;
  ts: number;
};

function short(x: string | number, maxDecimals = 5) {
  const n = typeof x === "string" ? Number(x || 0) : x;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}
const INPUT_MAX_DP = 18;
function sanitizeLoose(s: string) {
  const clean = s.replace(/[^0-9.]/g, "").replace(/(\..*?)\./g, "$1");
  if (clean.endsWith(".")) return clean;
  const [i, d = ""] = clean.split(".");
  return d ? `${i}.${d.slice(0, INPUT_MAX_DP)}` : i;
}
const DISPLAY_DP = 5;
function tidyOnBlur(v: string) {
  if (!v || v === ".") return "";
  if (v.endsWith(".")) v = v.slice(0, -1);
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(DISPLAY_DP).replace(/\.?0+$/, "");
}
function safeParseUnits(v: string, decimals: number): bigint {
  if (!v || v === "." || v === "0." || v.endsWith(".")) return 0n;
  try { return parseUnits(v, decimals); } catch { return 0n; }
}

const posKey = (addr?: string, chainId?: number) =>
  addr && chainId ? `airon.lp.positions.${addr.toLowerCase()}.${chainId}` : "";

const sortPair = (a: SelToken, b: SelToken) => {
  const A = (a.address === "native" ? "0x0000" : (a.address as string)).toLowerCase();
  const B = (b.address === "native" ? "0x0000" : (b.address as string)).toLowerCase();
  return A < B ? [a, b] : [b, a];
};

const CHAIN_META: Record<number, { name: string; logo: string; explorerTx?: (h: Hex)=>string }> = {
  56: { name: "BNB Chain", logo: bnbLogo, explorerTx: (h)=>`https://bscscan.com/tx/${h}` },
  1: { name: "Ethereum", logo: ethLogo, explorerTx: (h)=>`https://etherscan.io/tx/${h}` },
  42161: { name: "Arbitrum", logo: arbLogo, explorerTx: (h)=>`https://arbiscan.io/tx/${h}` },
  8453: { name: "Base", logo: baseLogo, explorerTx: (h)=>`https://basescan.org/tx/${h}` },
  97: { name: "BNB Testnet", logo: bnbtLogo, explorerTx: (h)=>`https://testnet.bscscan.com/tx/${h}` },
  11155111: { name: "ETH Sepolia", logo: sepoliaLogo, explorerTx: (h)=>`https://sepolia.etherscan.io/tx/${h}` },
  421614: { name: "ARB Testnet", logo: arbTestLogo },
  84532: { name: "Base Testnet", logo: baseTestLogo },
  2030: { name: "Airon Testnet", logo: aironLogo },
};

const SLIPP_KEY = "airon.lp.slippage";
const MEV_KEY = "airon.lp.mev";


type SwapRowProps = {
  label: string;
  token: SelToken | null;
  onPick: () => void;
  amount: string;
  onAmount: (v: string) => void;
  balance?: string;
  side: "A" | "B";
};
const SwapRow = memo(function SwapRow({
  label, token, onPick, amount, onAmount, balance,
}: SwapRowProps) {
  const disabled = !token;
  return (
    <div className="swap-block">
      <div className="swap-label">
        {label}
        {balance !== undefined && token && <span className="swap-balance">Balance {short(balance)}</span>}
      </div>
      <div className="swap-row">
        <button className="asset-btn" onClick={onPick}>
          {token ? (<>
            <TokenIcon src={token.logo || defaultLogo} alt={token.symbol} />
            <span className="ticker">{token.symbol}</span>
          </>) : (<span className="placeholder">Select token</span>)}
          <span className="chev">▾</span>
        </button>
        <div className={"amt-box " + (disabled ? "disabled" : "")}>
          <input
            value={amount}
            onChange={(e) => !disabled && onAmount(sanitizeLoose(e.target.value))}
            onBlur={(e) => !disabled && onAmount(tidyOnBlur(e.target.value))}
            placeholder={disabled ? "Select token first" : "0.0"}
            inputMode="decimal"
            autoComplete="off" autoCorrect="off" spellCheck={false}
            disabled={disabled}
          />
          {token && <span className="code">{token.symbol}</span>}
        </div>
      </div>
    </div>
  );
});

const StatRow = memo(function StatRow({
  label, value, sub,
}: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="stat-row">
      <div className="s-l">
        <div className="s-label">{label}</div>
        {sub && <div className="s-sub">{sub}</div>}
      </div>
      <div className="s-v">{value}</div>
    </div>
  );
});


export default function LiquidityPage() {
  const { address: account, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });
  const { data: currentBlock } = useBlockNumber({ chainId, watch: true });

  const dex = DEX[chainId];
  const routerAddr = dex?.router as Address | undefined;
  const wnative = dex?.wnative as Address | undefined;
  const chain = CHAIN_META[chainId] || { name: `Chain ${chainId}`, logo: defaultLogo };

  const [tokA, setTokA] = useState<SelToken | null>(null);
  const [tokB, setTokB] = useState<SelToken | null>(null);
  const [pickSide, setPickSide] = useState<null | "A" | "B">(null);

  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");

  const [confirmAdd, setConfirmAdd] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [isApproving, setIsApproving] = useState<false | "A" | "B">(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);


  useEffect(() => {
    const meta = NATIVE[chainId];
    if (meta && !tokA) {
      setTokA({ chainId, address: "native", symbol: meta.symbol, logo: meta.logo });
    } else if (tokA && tokA.chainId !== chainId) {
      const m = NATIVE[chainId];
      if (m) setTokA({ chainId, address: "native", symbol: m.symbol, logo: m.logo });
    }

  }, [chainId]);

  
  const [slippage, setSlippage] = useState<number>(() => {
    const v = Number(localStorage.getItem(SLIPP_KEY) || 1);
    return Number.isFinite(v) ? v : 1;
  });
  const [mevOn, setMevOn] = useState<boolean>(() => {
    const v = localStorage.getItem(MEV_KEY);
    return v === null ? true : v === "1";
  });
  useEffect(() => { localStorage.setItem(SLIPP_KEY, String(slippage)); }, [slippage]);
  useEffect(() => { localStorage.setItem(MEV_KEY, mevOn ? "1" : "0"); }, [mevOn]);

  const clampSlippage = (n: number) => (!Number.isFinite(n) ? 1 : Math.max(0.1, Math.min(5, Number(n.toFixed(2)))));
  const isNative = (t?: SelToken | null) => t?.address === "native";

  
  const balA = useBalance({
    address: account,
    chainId: tokA?.chainId ?? chainId,
    token: tokA && !isNative(tokA) ? (tokA.address as Address) : undefined,
    
    query: { enabled: isConnected && !!account && !!tokA && tokA.chainId === chainId },
  });
const balB = useBalance({
  address: account,
  chainId: tokB?.chainId ?? chainId,
  token: tokB && !isNative(tokB) ? (tokB.address as Address) : undefined,
  query: { enabled: isConnected && !!account && !!tokB && tokB.chainId === chainId },
});



  const [pairAddr, setPairAddr] = useState<Address | null>(null);
  const [token0, setToken0] = useState<Address | null>(null);
  const [token1, setToken1] = useState<Address | null>(null);
  const [res0, setRes0] = useState<bigint>(0n);
  const [res1, setRes1] = useState<bigint>(0n);


function quoteCounter(side: "A" | "B", inAmount: string): string | null {
  try {
    if (!tokA || !tokB || !token0 || !token1) return null;
    if (!inAmount || inAmount.endsWith(".")) return null;
    if (res0 === 0n || res1 === 0n) return null;

    const addrA = (tokA.address === "native" ? wnative : tokA.address) as Address;
    const addrB = (tokB.address === "native" ? wnative : tokB.address) as Address;
    if (!addrA || !addrB) return null;

    const isA0 = addrA.toLowerCase() === token0!.toLowerCase();
    const RA = isA0 ? res0 : res1;
    const RB = isA0 ? res1 : res0; 

   
    const inWei = parseUnits(inAmount, side === "A" ? decA : decB);
    if (inWei === 0n || RA === 0n || RB === 0n) return "0";


    const outWei =
      side === "A" ? (inWei * RB) / RA : (inWei * RA) / RB;

    const out = formatUnits(outWei, side === "A" ? decB : decA);
    const n = Number(out);
    return Number.isFinite(n)
      ? n.toFixed(DISPLAY_DP).replace(/\.?0+$/, "")
      : out;
  } catch {
    return null;
  }
}

function setAmountAndSync(side: "A" | "B", raw: string) {
  const clean = sanitizeLoose(raw);
  if (side === "A") {
    setAmtA(clean);
    const c = quoteCounter("A", clean);
    if (c != null && c !== amtB) setAmtB(c);
  } else {
    setAmtB(clean);
    const c = quoteCounter("B", clean);
    if (c != null && c !== amtA) setAmtA(c);
  }
}



  function gasBuffer(t?: SelToken | null) { return t && isNative(t) ? 0.0005 : 0; }
  function fillPct(side: "A" | "B", pct: number) {
    const t = side === "A" ? tokA : tokB;
    if (!t) return;
    const bal = side === "A" ? Number(balA.data?.formatted || 0) : Number(balB.data?.formatted || 0);
    const v = Math.max(0, bal * pct - gasBuffer(t));
    const pretty = v ? v.toFixed(DISPLAY_DP).replace(/\.?0+$/, "") : "";
    setAmountAndSync(side, pretty);
  }


  const [decA, setDecA] = useState<number>(18);
  const [decB, setDecB] = useState<number>(18);
  const [allowA, setAllowA] = useState<bigint>(0n);
  const [allowB, setAllowB] = useState<bigint>(0n);

  useEffect(() => {
    (async () => {
      if (!publicClient) return;
      try {
        if (tokA && !isNative(tokA)) setDecA(Number(await publicClient.readContract({ address: tokA.address as Address, abi: ERC20_ABI, functionName: "decimals" }).catch(()=>18)));
        else setDecA(18);
        if (tokB && !isNative(tokB)) setDecB(Number(await publicClient.readContract({ address: tokB.address as Address, abi: ERC20_ABI, functionName: "decimals" }).catch(()=>18)));
        else setDecB(18);
      } catch {}
    })();
  }, [publicClient, tokA, tokB]);

  useEffect(() => {
    (async () => {
      if (!publicClient || !account || !routerAddr) return;
      try {
        if (tokA && !isNative(tokA)) {
          setAllowA(await publicClient.readContract({ address: tokA.address as Address, abi: ERC20_ABI, functionName: "allowance", args: [account, routerAddr] }).catch(()=>0n) as bigint);
        } else setAllowA(maxUint256);
        if (tokB && !isNative(tokB)) {
          setAllowB(await publicClient.readContract({ address: tokB.address as Address, abi: ERC20_ABI, functionName: "allowance", args: [account, routerAddr] }).catch(()=>0n) as bigint);
        } else setAllowB(maxUint256);
      } catch {}
    })();
  }, [publicClient, account, routerAddr, tokA, tokB]);


  const [positions, setPositions] = useState<Position[]>([]);
  const savePositions = (list: Position[]) => {
    const k = posKey(account, chainId);
    if (!k) return;
    localStorage.setItem(k, JSON.stringify(list)); setPositions(list);
  };

  useEffect(() => {
    const k = posKey(account, chainId);
    if (!k) return;
    try { setPositions(JSON.parse(localStorage.getItem(k) || "[]")); } catch { setPositions([]); }
  }, [account, chainId]);

  const sameChain = useMemo(
    () => (!tokA || !tokB ? true : tokA.chainId === tokB.chainId && tokA.chainId === chainId),
    [tokA, tokB, chainId]
  );
  const toWei = (v: string, dec: number) => safeParseUnits(v || "0", dec);


  const enoughA = useMemo(() => {
    if (!tokA) return false;
    const bal = Number(balA.data?.formatted || 0) - gasBuffer(tokA);
    const need = Number(amtA || 0);
    return bal >= need && need > 0;
  }, [tokA, balA.data?.formatted, amtA]);

  const enoughB = useMemo(() => {
    if (!tokB) return false;
    const bal = Number(balB.data?.formatted || 0) - gasBuffer(tokB);
    const need = Number(amtB || 0);
    return bal >= need && need > 0;
  }, [tokB, balB.data?.formatted, amtB]);

  const needsApproveA = useMemo(() => !tokA || isNative(tokA) ? false : allowA < toWei(amtA || "0", decA), [tokA, amtA, decA, allowA]);
  const needsApproveB = useMemo(() => !tokB || isNative(tokB) ? false : allowB < toWei(amtB || "0", decB), [tokB, amtB, decB, allowB]);
  const awaitingApprove = needsApproveA ? "A" : (needsApproveB ? "B" : null);


  async function approveToken(which: "A" | "B") {
    if (!walletClient || !routerAddr || !account) return;
    const t = which === "A" ? tokA : tokB;
    if (!t || isNative(t)) return;
    setTxError(null);
    setIsApproving(which);
    try {
      const hash = await walletClient.writeContract({
        address: t.address as Address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [routerAddr, maxUint256],
        account,
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      if (which === "A") setAllowA(maxUint256); else setAllowB(maxUint256);
    } catch (e: any) {
      setTxError(e?.shortMessage || e?.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  }


  const [lpSupply, setLpSupply] = useState<bigint>(0n);
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient || !DEX || !tokA || !tokB) {
          setPairAddr(null); setRes0(0n); setRes1(0n); setToken0(null); setToken1(null); setLpSupply(0n); return;
        }
        const a = isNative(tokA) ? wnative : (tokA.address as Address);
        const b = isNative(tokB) ? wnative : (tokB.address as Address);
        if (!a || !b || !DEX[chainId]?.factory) return;

        const p = (await publicClient.readContract({
          address: DEX[chainId]!.factory as Address, abi: FACTORY_V2_ABI,
          functionName: "getPair", args: [a, b],
        })) as Address;

        if (!p || p === zeroAddress) { setPairAddr(null); setRes0(0n); setRes1(0n); setToken0(null); setToken1(null); setLpSupply(0n); return; }

        setPairAddr(p);
        const t0 = (await publicClient.readContract({ address: p, abi: PAIR_V2_ABI, functionName: "token0" })) as Address;
        const t1 = (await publicClient.readContract({ address: p, abi: PAIR_V2_ABI, functionName: "token1" })) as Address;
        setToken0(t0); setToken1(t1);

        const [r0, r1] = (await publicClient.readContract({ address: p, abi: PAIR_V2_ABI, functionName: "getReserves" })) as unknown as [bigint, bigint, number];
        setRes0(r0); setRes1(r1);
        const ts = (await publicClient.readContract({ address: p, abi: PAIR_V2_ABI, functionName: "totalSupply" })) as bigint;
        setLpSupply(ts);
      } catch {
        setPairAddr(null); setRes0(0n); setRes1(0n); setToken0(null); setToken1(null); setLpSupply(0n);
      }
    })();
  }, [publicClient, chainId, tokA, tokB, wnative]);

  useEffect(() => {
  (async () => {
    if (!publicClient || !pairAddr) return;
    try {
      const [r0, r1] = (await publicClient.readContract({
        address: pairAddr,
        abi: PAIR_V2_ABI,
        functionName: "getReserves",
      })) as unknown as [bigint, bigint, number];
      setRes0(r0);
      setRes1(r1);
    } catch {}
  })();
 
}, [publicClient, pairAddr, currentBlock]);


  const priceAB = useMemo(() => {
    if (pairAddr && token0 && token1 && res0 > 0n && res1 > 0n && tokA && tokB) {
      const addrA = (tokA.address === "native" ? wnative : tokA.address) as Address;
      if (!addrA) return null;
      const isA0 = addrA.toLowerCase() === token0.toLowerCase();
      const RA = Number(formatUnits(isA0 ? res0 : res1, decA));
      const RB = Number(formatUnits(isA0 ? res1 : res0, decB));
      if (RA > 0 && RB > 0) return RB / RA;
    }
    const A = Number(amtA || 0), B = Number(amtB || 0);
    if (A <= 0 || B <= 0) return null;
    return B / A;
  }, [pairAddr, token0, token1, res0, res1, tokA, tokB, decA, decB, wnative, amtA, amtB]);

  const poolPriceLabel = useMemo(() => {
    if (!tokA || !tokB || priceAB == null) return "—";
    return `1 ${tokA.symbol} = ${short(priceAB, 6)} ${tokB.symbol}`;
  }, [priceAB, tokA, tokB]);


  const minA = useMemo(() => {
    const A = Number(amtA || 0);
    if (!tokA || A <= 0) return null;
    const factor = 1 - clampSlippage(slippage) / 100;
    return Math.max(0, A * factor);
  }, [amtA, tokA, slippage]);
  const minB = useMemo(() => {
    const B = Number(amtB || 0);
    if (!tokB || B <= 0) return null;
    const factor = 1 - clampSlippage(slippage) / 100;
    return Math.max(0, B * factor);
  }, [amtB, tokB, slippage]);


  const [gwei, setGwei] = useState<string>("–");
  const { data: currentBlk } = useBlockNumber({ chainId, watch: true });
  useEffect(() => {
    (async () => {
      try {
        if (!publicClient) return;
        const gp = await publicClient.getGasPrice();
        const n = Number(formatUnits(gp, 9));
        setGwei(`${n.toFixed(1)} Gwei`);
      } catch { setGwei("–"); }
    })();
  }, [publicClient, currentBlk]);


  const { lpEstimate, sharePct } = useMemo(() => {
    try {
      if (!tokA || !tokB) return { lpEstimate: 0, sharePct: 0 };
      const A = toWei(amtA, decA);
      const B = toWei(amtB, decB);
      if (A === 0n || B === 0n) return { lpEstimate: 0, sharePct: 0 };

      if (pairAddr && res0 > 0n && res1 > 0n && lpSupply > 0n && token0 && token1) {
        const addrA = (tokA.address === "native" ? wnative : tokA.address) as Address;
        const isA0 = addrA?.toLowerCase() === token0.toLowerCase();
        const RA = isA0 ? res0 : res1;
        const RB = isA0 ? res1 : res0;

        const lFromA = (A * lpSupply) / RA;
        const lFromB = (B * lpSupply) / RB;
        const L = lFromA < lFromB ? lFromA : lFromB;
        const share = Number(L) / Number(lpSupply + L);
        return { lpEstimate: Number(formatUnits(L, 18)), sharePct: isFinite(share) ? share * 100 : 0 };
      }

      const sqrt = Math.sqrt(Number(A)) * Math.sqrt(Number(B));
      return { lpEstimate: sqrt || 0, sharePct: 100 };
    } catch { return { lpEstimate: 0, sharePct: 0 }; }
  }, [amtA, amtB, decA, decB, pairAddr, res0, res1, lpSupply, token0, token1, tokA, tokB, wnative]);

  async function doAdd() {
    if (!walletClient || !account || !routerAddr || !tokA || !tokB) return;
    setIsAdding(true); setTxError(null);
    try {
      const isNatA = isNative(tokA), isNatB = isNative(tokB);
      const amountADesired = toWei(amtA, decA);
      const amountBDesired = toWei(amtB, decB);
      const amountAMin = toWei(String(minA ?? 0), decA);
      const amountBMin = toWei(String(minB ?? 0), decB);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      if (isNatA && isNatB) throw new Error("Both sides cannot be native.");
      if (!enoughA || !enoughB) throw new Error("Insufficient balance for one of the tokens.");
      if (!routerAddr) throw new Error("Router missing");

      let hash: Hex;
      if (isNatA && !isNatB) {
        hash = await walletClient.writeContract({
          address: routerAddr, abi: ROUTER_V2_ABI, functionName: "addLiquidityETH",
          args: [tokB.address as Address, amountBDesired, amountBMin, amountAMin, account, deadline],
          account, value: amountADesired,
        });
      } else if (!isNatA && isNatB) {
        hash = await walletClient.writeContract({
          address: routerAddr, abi: ROUTER_V2_ABI, functionName: "addLiquidityETH",
          args: [tokA.address as Address, amountADesired, amountAMin, amountBMin, account, deadline],
          account, value: amountBDesired,
        });
      } else {
        hash = await walletClient.writeContract({
          address: routerAddr, abi: ROUTER_V2_ABI, functionName: "addLiquidity",
          args: [tokA.address as Address, tokB.address as Address, amountADesired, amountBDesired, amountAMin, amountBMin, account, deadline],
          account,
        });
      }

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        
        const [a, b] = sortPair(tokA, tokB);
        const id = `${chainId}:${String(a.address)}:${String(b.address)}`;
        const shares = Math.sqrt(Number(amtA) * Number(amtB)) || 0;
        const p: Position = { id, chainId, tokenA: a, tokenB: b, amountA: amtA, amountB: amtB, lpShares: String(shares), ts: Date.now() };
        const next = [...positions.filter((x) => x.id !== id), p];
        savePositions(next);

        
        try {
          await Promise.all([balA.refetch?.(), balB.refetch?.()]);
        } catch {}

        
        setAmtA(""); setAmtB(""); setConfirmAdd(false);
        setShowSuccess(true);
        window.setTimeout(() => setShowSuccess(false), 4000);
      } else {
        setTxError("Transaction failed");
      }
    } catch (e: any) {
      setTxError(e?.shortMessage || e?.message || "Transaction error");
    } finally { setIsAdding(false); }
  }

  const subtitle = "Add and manage liquidity positions with a streamlined on-chain flow.";


  const mainCtaLabel = useMemo(() => {
    if (!tokA || !tokB) return "Select tokens";
    if (awaitingApprove === "A") return `Approve ${tokA.symbol}`;
    if (awaitingApprove === "B") return `Approve ${tokB.symbol}`;
    if (!enoughA || !enoughB) return "Infuse Supply";
    return "Preview & Confirm";
  }, [tokA, tokB, awaitingApprove, enoughA, enoughB]);

  const mainCtaDisabled = useMemo(
    () => !isConnected || !sameChain || !tokA || !tokB ||
      Number(amtA) <= 0 || Number(amtB) <= 0 ||
      !routerAddr || isAdding || isApproving !== false || !enoughA || !enoughB,
    [isConnected, sameChain, tokA, tokB, amtA, amtB, routerAddr, isAdding, isApproving, enoughA, enoughB]
  );

  async function onMainCta() {
    if (awaitingApprove === "A") return approveToken("A");
    if (awaitingApprove === "B") return approveToken("B");
    setConfirmAdd(true);
  }


  useEffect(() => {
    if (pickSide) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [pickSide]);

  return (
    <div className="liq-wrap">

      <header className="liq-hero">
        <div className="crumbs"><b>Liquidity Airon DEX</b></div>
        <h1>Create a Pool</h1>
        <p>{subtitle}</p>
        <div className="hero-badges">
          <span className="badge green chain-badge"><TokenIcon src={chain.logo || defaultLogo} alt={chain.name} /><span>{chain.name}</span></span>
          <span className="badge blue">{gwei === "–" ? "Gas price —" : `Gas: ${gwei}`}</span>
          {!routerAddr && <span className="badge yellow">Router address missing for this chain</span>}
        </div>
      </header>


      <section className="panel">
        <div className="card glass">
          <div className="card-head">
            <div className="ch-title">Select pair</div>
            <div className="ch-sub">Pick tokens & amounts.</div>
          </div>

          <SwapRow
            label="Token A"
            token={tokA}
            onPick={() => setPickSide("A")}
            amount={amtA}
            onAmount={(v) => setAmountAndSync("A", v)}
            balance={tokA ? balA.data?.formatted : undefined}
            side="A"
          />
          {tokA && (
            <div className="chips">
              <button className="pill" onClick={() => fillPct("A", 0.1)}>10%</button>
              <button className="pill" onClick={() => fillPct("A", 0.5)}>50%</button>
              <button className="pill" onClick={() => fillPct("A", 1)}>MAX</button>
            </div>
          )}

          <div className="row-sep"><img className="plus-icon" src={plusIcon} alt="add token separator" /></div>

          <SwapRow
            label="Token B"
            token={tokB}
            onPick={() => setPickSide("B")}
            amount={amtB}
            onAmount={(v) => setAmountAndSync("B", v)}
            balance={tokB ? balB.data?.formatted : undefined}
            side="B"
          />
          {tokB && (
            <div className="chips">
              <button className="pill" onClick={() => fillPct("B", 0.1)}>10%</button>
              <button className="pill" onClick={() => fillPct("B", 0.5)}>50%</button>
              <button className="pill" onClick={() => fillPct("B", 1)}>MAX</button>
            </div>
          )}

          {!sameChain && <div className="alert warn">Both tokens must be on your current network.</div>}
          {tokA && tokB && (!enoughA || !enoughB) && (
            <div className="alert warn" style={{marginTop:8}}>
              Not enough balance. Top up {(!enoughA && tokA) ? tokA.symbol : ""}{(!enoughA && !enoughB) ? " & " : ""}{(!enoughB && tokB) ? tokB.symbol : ""}.
            </div>
          )}

         
          <div className="prefs-grid">
            <div className="pref-card">
              <div className="pref-head">
                <div className="ph-l">
                  <img className="pref-ic" src={slippageIcon} alt="slippage" />
                  <div>
                    <div className="pref-title">Slippage tolerance</div>
                    <div className="pref-sub">Liquidity slippage</div>
                  </div>
                </div>
                <div className="slip-input">
                  <input
                    value={slippage}
                    onChange={(e) => setSlippage(clampSlippage(Number(e.target.value)))}
                    onBlur={(e) => setSlippage(clampSlippage(Number(e.target.value)))}
                    type="number" min={0.1} max={5} step={0.1}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            <div className="pref-card">
              <div className="pref-head">
                <div className="ph-l">
                  <img className="pref-ic" src={mevIcon} alt="mev protection" />
                  <div>
                    <div className="pref-title">MEV Protection</div>
                    <div className="pref-sub">Protects you from frontrunning</div>
                  </div>
                </div>
                <button className={`toggle ${mevOn ? "on" : ""}`} onClick={() => setMevOn((v) => !v)} aria-pressed={mevOn}>
                  <span className="knob" />
                </button>
              </div>
            </div>
          </div>

          <div className="divider" />

         
          <div className="stats">
            <StatRow
              label="Pool price"
              value={<b>{poolPriceLabel}</b>}
              sub={pairAddr ? `Pair: ${pairAddr.slice(0, 6)}…${pairAddr.slice(-4)}` : "Pair will be created if not exists"}
            />
            <StatRow
              label="Your pool share"
              value={<b>{tokA && tokB && Number(amtA) > 0 && Number(amtB) > 0 ? "< 0.01%" : "—"}</b>}
              sub="Will update after adding."
            />
            <StatRow
              label="Est. after slippage"
              value={(minA != null && minB != null && tokA && tokB) ? (<b>{short(minA)} {tokA.symbol} &nbsp;&nbsp; {short(minB)} {tokB.symbol}</b>) : (<b>~</b>)}
              sub={`Slippage ${slippage}%${mevOn ? ", MEV on" : ""}.`}
            />
          </div>

   
          <div className="sticky-cta">
            <div className="row-btns wrap">
              <button
                className={`btn primary big ${isAdding || isApproving ? "loading" : ""}`}
                disabled={mainCtaDisabled}
                onClick={onMainCta}
              >
                {isApproving ? `Approving ${isApproving === "A" ? tokA?.symbol : tokB?.symbol}…` :
                 isAdding ? "Confirming…" : mainCtaLabel}
              </button>
            </div>
            {txError && <div className="alert error" style={{ marginTop: 10 }}>{txError}</div>}
          </div>
        </div>
      </section>

     
      {pickSide && (
        <div className="liq-tkselect" role="dialog" aria-modal="true">
          <span className="blur-layer" aria-hidden="true" />
          <div className="liq-backdrop" onClick={() => setPickSide(null)} aria-hidden="true" />
          <TokenSelect
            side="from"
            connectedChainId={chainId}
            onPick={(t) => {
              const sel = t as SelToken;
              if (sel.chainId !== chainId) return;
              if (pickSide === "A") setTokA(sel); else setTokB(sel);
              setAmtA(""); setAmtB("");
              setPickSide(null);
            }}
            onClose={() => setPickSide(null)}
          />
        </div>
      )}

     
      {confirmAdd && tokA && tokB && (
        <>
          <div className="modal-backdrop" onClick={() => !isAdding && setConfirmAdd(false)} />
          <div className="modal-card pancake">
            <div className="modal-header">
              <div className="modal-title">You will receive</div>
              <button className="modal-x" onClick={() => !isAdding && setConfirmAdd(false)} aria-label="Close">×</button>
            </div>

            <div className="receive-box">
              <div className="lp-chip">
                <TokenIcon src={tokA.logo || defaultLogo} alt={tokA.symbol} />
                <TokenIcon src={tokB.logo || defaultLogo} alt={tokB.symbol} />
                <span>{tokA.symbol}-{tokB.symbol} LP</span>
              </div>
              <div className="lp-amt">{short(lpEstimate || 0)}</div>
            </div>

            <div className="share-row"><span>Your share in the pair</span><b>{sharePct ? `${short(sharePct, 4)}%` : "—"}</b></div>

            <div className="input-block">
              <div
                className="mini-pie"
                style={{
                  background: `conic-gradient(var(--air-accent2) ${(Number(amtA||0)/(Number(amtA||0)+Number(amtB||0)||1))*360}deg, var(--air-purple) 0)`
                }}
              />
              <div className="mini-rows">
                <div className="mini-row">
                  <span className="dot a" />
                  <span className="mini-tok">{tokA.symbol}</span>
                  <span className="mini-amt">{short(amtA || 0)}</span>
                </div>
                <div className="mini-row">
                  <span className="dot b" />
                  <span className="mini-tok">{tokB.symbol}</span>
                  <span className="mini-amt">{short(amtB || 0)}</span>
                </div>
              </div>
            </div>

            <div className="rates">
              <div>RATES</div>
              <div className="rate-lines">
                <span>{priceAB != null ? `1 ${tokA.symbol} = ${short(priceAB,6)} ${tokB.symbol}` : "—"}</span>
                <span>{priceAB != null && priceAB > 0 ? `1 ${tokB.symbol} = ${short(1/priceAB,6)} ${tokA.symbol}` : "—"}</span>
              </div>
            </div>

            <div className="slippage-row"><span>SLIPPAGE TOLERANCE</span><b>{clampSlippage(slippage)}%</b></div>

            <button
              className={`btn primary bright big processing ${isAdding ? "loading" : ""}`}
              onClick={doAdd}
              disabled={isAdding}
            >
              {isAdding ? (<span>Processing<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>) : "Confirm Supply"}
            </button>

            {txError && <div className="alert error" style={{ marginTop: 10 }}>{txError}</div>}
          </div>
        </>
      )}

      
      {showSuccess && (
        <div className="toast success" role="status" aria-live="polite">
          <img src={confirmedIcon} alt="" />
          <div>
            <b>Liquidity added successfully</b>
            <div className="t-sub">Your position has been updated.</div>
          </div>
          <button className="toast-x" onClick={() => setShowSuccess(false)} aria-label="Close">×</button>
        </div>
      )}
    </div>
  );
}
