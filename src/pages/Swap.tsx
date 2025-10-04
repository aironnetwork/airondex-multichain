// Swap.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./Swap.styles.css";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useBalance,
  useWalletClient,
} from "wagmi";
import type { Address } from "viem";
import {
  parseUnits,
  erc20Abi,
  zeroAddress,
  maxUint256,
  getAddress,
} from "viem";

import TokenSelect from "../components/TokenSelect";
import SettingsModal from "../components/SettingsModal";
import iconSettings from "../assets/swap/settings.png";
import iconArrow from "../assets/swap/arrow.png";
import TxModal from "../components/TxModal";
import type { TxModalKind } from "../components/TxModal";

import logoBNB from "../assets/chain/bnb.png";
import logoETH from "../assets/chain/ethereum.png";
import logoBASE from "../assets/chain/base.png";
import logoARB from "../assets/chain/arbitrum.png";
import logoAIRON from "../assets/chain/airon.png";


type Chain = { key: string; name: string; chainId: number; native: string };
const CHAINS: Chain[] = [
  { key: "bsc", name: "BNB Chain", chainId: 56, native: "BNB" },
  { key: "eth", name: "Ethereum", chainId: 1, native: "ETH" },
  { key: "base", name: "Base", chainId: 8453, native: "ETH" },
  { key: "arb", name: "Arbitrum", chainId: 42161, native: "ETH" },
  { key: "bsc", name: "BNB Chain Testnet", chainId: 97, native: "tBNB" },
  { key: "eth", name: "Sepolia", chainId: 11155111 , native: "ETH Sepolia" },
  { key: "eth", name: "Sepolia", chainId: 421614 , native: "ETH Sepolia" },
  { key: "eth", name: "Base Testnet", chainId: 84532 , native: "ETH Sepolia" },
  { key: "airon", name: "Airon Testnet", chainId: 2030 , native: "tAIR" },
];
const NATIVE_LOGO: Record<number, string> = {
  56: logoBNB,
  1: logoETH,
  8453: logoBASE,
  42161: logoARB,
  97: logoBNB,
  11155111: logoETH,
  421614: logoARB,
  84532: logoBASE,
  2030: logoAIRON,
};


const WNATIVE: Partial<Record<number, string>> = {
  56: "0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  8453: "0x4200000000000000000000000000000000000006",
  97: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  421614: "0x1bdc540dEB9Ed1fA29964DeEcCc524A8f5e2198e",
  84532: "0x4200000000000000000000000000000000000006",
  2030: "0x11C43293631a7c810918A10164016cEe458ac64D",
};


const ROUTER_V2: Partial<Record<number, string>> = {
  56: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  8453:"0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  42161:"0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  97:"0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  11155111:"0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  421614:"0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  2030:"0x224cd6F72660fE1eFA650255a2bCa9670b4d38c1",
  84532 : "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb"
  
};
const QUOTER_V3: Partial<Record<number, string>> = {
  1: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
  42161: "0x61fFE014bA17989E743c5F6cB21Bf9697530B21e",
  8453: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
  
};
const FEE_TIERS: Partial<Record<number, number[]>> = {
  56: [500, 2500, 10000],
  1: [500, 3000, 10000],
  42161: [500, 3000, 10000],
  8453: [500, 3000, 10000],
};
const STABLES: Partial<Record<number, string[]>> = {
  56: [
    "0x55d398326f99059fF775485246999027B3197955",
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  ],
  1: [
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ],
  42161: ["0xFF970A61A04b1cA14834A43f5de4533ebDDB5CC8"],
  8453: ["0x833589fCD6EDB6E08f4c7C32D4f71B54B2689996"],
};


const V2RouterAbi = [
  {
    type: "function",
    name: "getAmountsOut",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

const V2SwapSupportingAbi = [
  {
    type: "function",
    stateMutability: "payable",
    name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const QuoterV3Abi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "view",
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
          { name: "amountIn", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const WNATIVE_ABI = [
  { type: "function", name: "deposit", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "wad" }], outputs: [] },
] as const;


const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });
const uniqPaths = (paths: Address[][]) => {
  const seen = new Set<string>(); const out: Address[][] = [];
  for (const p of paths) { const k = p.join(">").toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(p); } }
  return out;
};
const clean = (arr: Address[]) => arr.filter((x, i, a) => i === 0 || x.toLowerCase() !== a[i - 1].toLowerCase());
const lc = (addr: Address) => addr.toLowerCase() as Address;
const scaleDown = (v: bigint, d: number) => Number(v) / 10 ** d;


const asAddr = (v?: string | null): Address | undefined => {
  if (!v) return undefined;
  try { return getAddress(v); } catch { return undefined; }
};


const NATIVE_GAS_RESERVE: Partial<Record<number, number>> = { 56: 0.0003, 1: 0.00025, 42161: 0.00025, 8453: 0.00025 };
const gasReserve = (cid: number) => NATIVE_GAS_RESERVE[cid] ?? 0.0003;

type GasPreset = "default" | "standard" | "fast" | "instant";
function useGas(chainId: number, preset: GasPreset) {
  const pc = usePublicClient({ chainId });
  const [fees, setFees] = useState< | { type: "eip1559" | "legacy"; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint; gasPrice?: bigint; } | null>(null);

  useEffect(() => {
    if (!pc) return;
    let alive = true;
    const pull = async () => {
      try {
        const est = await (pc as any).estimateFeesPerGas();
        if (!alive) return;
        const bump = preset === "standard" ? 0.1 : preset === "fast" ? 0.12 : preset === "instant" ? 0.15 : 0;
        const add = (BigInt(Math.floor(bump * 1e9)) as unknown) as bigint; 
        if ("maxFeePerGas" in est && est.maxFeePerGas) {
          setFees({ type: "eip1559", maxFeePerGas: (est.maxFeePerGas ?? 0n) + add, maxPriorityFeePerGas: (est.maxPriorityFeePerGas ?? 0n) + add });
        } else {
          const gp = (est.gasPrice ?? (await pc.getGasPrice())) + add;
          setFees({ type: "legacy", gasPrice: gp });
        }
      } catch {}
    };
    pull();
    const t = setInterval(pull, 10_000);
    return () => { alive = false; clearInterval(t); };
  }, [pc, preset]);

  return fees;
}


const TaxFnSingle = ["totalTax","taxFee","_taxFee","sellTax","buyTax","transferTax","fee","fees","liquidityFee","marketingFee","totalFee","_totalFee","sellFee","buyFee","transferFee","tax","_tax","taxes"] as const;
const TaxFnTuple = ["getTaxes","taxesInfo","feesInfo","getFees","feeInfo"] as const;
const DenominatorFn = ["feeDenominator","denominator","taxDenominator","FEE_DENOMINATOR","TAX_DENOMINATOR"] as const;

function asPctGuess(raw: number, denom?: number) {
  if (!Number.isFinite(raw)) return 0;
  if (denom && denom > 0) return (100 * raw) / denom;
  if (raw > 0 && raw <= 50) return raw;
  if (raw > 50 && raw <= 5000) return raw / 100;
  if (raw > 5000 && raw <= 10000) return (100 * raw) / 10000;
  return 0;
}

function useTokenTax(chainId: number, token?: Address | null) {
  const pc = usePublicClient({ chainId });
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!pc || !token || token === zeroAddress) { setPct(null); return; }
        let denom: number | undefined;
        for (const name of DenominatorFn) {
          try {
            const abi = [{ type:"function", name, stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] }] as const;
            const v = await (pc as any).readContract({ address: token, abi, functionName: name as any });
            const n = Number(v); if (Number.isFinite(n) && n > 0) { denom = n; break; }
          } catch {}
        }
        const candidates: number[] = [];
        for (const name of TaxFnSingle) {
          try {
            const abi = [{ type:"function", name, stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] }] as const;
            const v = await (pc as any).readContract({ address: token, abi, functionName: name as any });
            const n = asPctGuess(Number(v), denom); if (n > 0) candidates.push(n);
          } catch {}
        }
        for (const name of TaxFnTuple) {
          try {
            const abi = [{ type:"function", name, stateMutability:"view", inputs:[], outputs:[{ components:[{type:"uint256"},{type:"uint256"},{type:"uint256"}], type:"tuple" }]}] as const;
            const out = await (pc as any).readContract({ address: token, abi, functionName: name as any })
              .catch(async () => {
                const abi2 = [{ type:"function", name, stateMutability:"view", inputs:[], outputs:[{ components:[{type:"uint256"},{type:"uint256"}], type:"tuple" }]}] as const;
                return (pc as any).readContract({ address: token, abi: abi2, functionName: name as any });
              });
            const arr = Array.isArray(out) ? out : (Object.values(out || {}) as any[]);
            for (const x of arr) { const n = asPctGuess(Number(x), denom); if (n > 0) candidates.push(n); }
          } catch {}
        }
        const best = Math.max(0, ...candidates);
        const finalPct = Math.max(0, Math.min(50, best));
        if (!alive) return;
        setPct(candidates.length ? finalPct : null);
      } catch { if (!alive) return; setPct(null); }
    })();
    return () => { alive = false; };
  }, [pc, token, chainId]);

  return pct;
}


function useTokenMeta(chainId: number, token?: Address | null, fallback?: { symbol?: string; decimals?: number }) {
  const pc = usePublicClient({ chainId });
  const [meta, setMeta] = useState<{ symbol?: string; decimals?: number }>({ symbol: fallback?.symbol, decimals: fallback?.decimals });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!pc || !token) { setMeta({ symbol: fallback?.symbol, decimals: fallback?.decimals }); return; }
        const [sym, dec] = await Promise.all([
          (pc as any).readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => fallback?.symbol),
          (pc as any).readContract({ address: token, abi: erc20Abi, functionName: "decimals" }).catch(() => fallback?.decimals ?? 18),
        ]);
        if (!alive) return;
        setMeta({ symbol: String(sym ?? fallback?.symbol), decimals: Number(dec ?? 18) });
      } catch { if (!alive) return; setMeta({ symbol: fallback?.symbol, decimals: fallback?.decimals ?? 18 }); }
    })();
    return () => { alive = false; };
  }, [pc, token]);

  return meta;
}


function useBestQuote({
  chainId, tokenIn, tokenOut, amountInFloat, decimalsIn, slippageBps, enabled = true, blindMinOut = false,
}: { chainId: number; tokenIn: Address; tokenOut: Address; amountInFloat: string; decimalsIn: number; slippageBps: number; enabled?: boolean; blindMinOut?: boolean; }) {
  const pc = usePublicClient({ chainId });
  const v2 = asAddr(ROUTER_V2[chainId]) as Address | undefined;
  const v3 = asAddr(QUOTER_V3[chainId]) as Address | undefined;
  const st = (STABLES[chainId] || []).map(asAddr).filter(Boolean) as Address[];
  const feeTiers = FEE_TIERS[chainId] || [500, 2500, 10000];

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<null | { proto: "v2" | "v3"; amountOut: bigint; amountOutMin: bigint; path: Address[]; fee?: number[]; }>(null);

  const key = [chainId, tokenIn, tokenOut, amountInFloat, decimalsIn, slippageBps, enabled, blindMinOut].join("|");

  useEffect(() => {
    if (!pc || !enabled) { setOut(null); setErr(null); setLoading(false); return; }
    if (!(Number(amountInFloat) > 0)) { setOut(null); setErr(null); return; }

    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const amountIn = parseUnits((amountInFloat || "0") as `${number}`, decimalsIn ?? 18);

        const basePaths: Address[][] = [];
        basePaths.push(clean([tokenIn, tokenOut]) as Address[]);
        const wnative = asAddr(WNATIVE[chainId]);
        if (wnative && tokenIn !== wnative && tokenOut !== wnative) basePaths.push(clean([tokenIn, wnative, tokenOut]) as Address[]);
        for (const s of st) basePaths.push(clean([tokenIn, s, tokenOut]) as Address[]);
        for (const a of st) for (const b of st) if (a !== b) basePaths.push(clean([tokenIn, a, b, tokenOut]) as Address[]);
        const v2paths = uniqPaths(basePaths);

        let bestV2: { out: bigint; path: Address[] } | null = null;
        if (v2) {
          for (const path of v2paths) {
            try {
              const amounts = (await (pc as any).readContract({ address: lc(v2), abi: V2RouterAbi, functionName: "getAmountsOut", args: [amountIn, path.map(lc) as Address[]], })) as unknown as bigint[];
              const o = amounts[amounts.length - 1];
              if (!bestV2 || o > bestV2.out) bestV2 = { out: o, path: path.map(lc) as Address[] };
            } catch {}
          }
        }

        if (bestV2) {
          const min = blindMinOut ? 1n : bestV2.out - (bestV2.out * BigInt(slippageBps)) / 10_000n;
          if (!alive) return;
          setOut({ proto: "v2", amountOut: bestV2.out, amountOutMin: min, path: bestV2.path });
          setLoading(false);
          return;
        }

        if (v3) {
          type Hop = { path: Address[]; fees: number[] };
          const cands: Hop[] = [];
          for (const fee of feeTiers) cands.push({ path: clean([tokenIn, tokenOut]) as Address[], fees: [fee] });
          const w = asAddr(WNATIVE[chainId]);
          if (w && tokenIn !== w && tokenOut !== w)
            for (const f1 of feeTiers) for (const f2 of feeTiers) cands.push({ path: clean([tokenIn, w, tokenOut]) as Address[], fees: [f1, f2] });
          for (const s of st) for (const f1 of feeTiers) for (const f2 of feeTiers) cands.push({ path: clean([tokenIn, s, tokenOut]) as Address[], fees: [f1, f2] });

          let bestV3: { out: bigint; hop: Hop } | null = null;
          for (const hop of cands) {
            try {
              let amt = amountIn;
              for (let i = 0; i < hop.path.length - 1; i++) {
                const a = lc(hop.path[i] as Address), b = lc(hop.path[i + 1] as Address), fee = hop.fees[i];
                const quoted = (await (pc as any).readContract({
                  address: lc(v3), abi: QuoterV3Abi, functionName: "quoteExactInputSingle",
                  args: [{ tokenIn: a, tokenOut: b, fee, sqrtPriceLimitX96: 0n, amountIn: amt }],
                })) as unknown as bigint;
                amt = quoted;
              }
              if (!bestV3 || amt > bestV3.out) bestV3 = { out: amt, hop };
            } catch {}
          }
          if (bestV3) {
            const min = blindMinOut ? 1n : bestV3.out - (bestV3.out * BigInt(slippageBps)) / 10_000n;
            if (!alive) return;
            setOut({ proto: "v3", amountOut: bestV3.out, amountOutMin: min, path: bestV3.hop.path.map(lc) as Address[], fee: bestV3.hop.fees });
            setLoading(false);
            return;
          }
        }

        if (!alive) return;
        setOut(null);
        setErr(ROUTER_V2[chainId] ? "Route not available" : "Router V2 not configured");
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.shortMessage || e?.message || "Quote failed");
        setOut(null);
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [key]);

  return { loading, error: err, quote: out };
}


function useCrossEstimate({ srcChainId, dstChainId, tokenIn, tokenOut, amountInFloat, decimalsIn, enabled = true, }:{
  srcChainId: number; dstChainId: number; tokenIn: Address; tokenOut: Address; amountInFloat: string; decimalsIn: number; enabled?: boolean;
}) {
  const pcSrc = usePublicClient({ chainId: srcChainId });
  const pcDst = usePublicClient({ chainId: dstChainId });

  const [out, setOut] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);

  const dstQuoter = asAddr(QUOTER_V3[dstChainId]);
  const bridgeDst = asAddr(WNATIVE[dstChainId]);

  const key = [srcChainId, dstChainId, tokenIn, tokenOut, amountInFloat, decimalsIn, enabled].join("|");

  useEffect(() => {
    if (!enabled) { setOut(null); setLoading(false); return; }
    if (!pcSrc || !pcDst) return;
    if (!(Number(amountInFloat) > 0)) { setOut(null); return; }
    if (!dstQuoter || !bridgeDst) { setOut(null); return; }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const amountIn = parseUnits((amountInFloat || "0") as `${number}`, decimalsIn ?? 18);
        const feeTiers = FEE_TIERS[dstChainId] || [500, 3000, 10000];
        let best = 0n;
        for (const fee of feeTiers) {
          try {
            const quoted = (await (pcDst as any).readContract({
              address: dstQuoter as Address, abi: QuoterV3Abi, functionName: "quoteExactInputSingle",
              args: [{ tokenIn: bridgeDst, tokenOut, fee, sqrtPriceLimitX96: 0n, amountIn }],
            })) as unknown as bigint;
            if (quoted > best) best = quoted;
          } catch {}
        }
        if (alive) setOut(best);
      } catch { if (alive) setOut(null); }
      finally { if (alive) setLoading(false); }
    })();

    return () => { alive = false; };
  }, [key]);

  return { loading, amountOut: out };
}


type Sel = { address: Address | "native"; symbol: string; decimals: number; logo?: string };
const addrEq = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const isMinOutRevert = (msg?: string) => {
  const m = (msg || "").toLowerCase();
  return m.includes("insufficient_output_amount") || m.includes("insufficient output amount") || m.includes("excessive") || m.includes("slippage") || m.includes("k");
};


type SlippageMode = "auto" | "fixed" | "custom";
type AutoSlip = { mode: "safe"; pct: number } | { mode: "blind" };
function resolveAutoSlippage(detectedTaxPct?: number | null): AutoSlip {
  const n = typeof detectedTaxPct === "number" && isFinite(detectedTaxPct) ? detectedTaxPct : 0;
  if (n > 0) return { mode: "safe", pct: Math.max(0, Math.min(50, n)) };
  return { mode: "blind" };
}


export default function SwapAiron() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const walletChainId = useChainId();


  const [chainId, setChainId] = useState<number>(walletChainId ?? 56);
  useEffect(() => { if (walletChainId && walletChainId !== chainId) setChainId(walletChainId); }, [walletChainId]); // eslint-disable-line

  const pc = usePublicClient({ chainId });
  const chain = CHAINS.find((c) => c.chainId === chainId) || CHAINS[0];

  
  const [fromToken, setFromToken] = useState<Sel>({ address: "native", symbol: "NATIVE", decimals: 18 });
  const [toToken, setToToken] = useState<Sel>({ address: "0x0000000000000000000000000000000000000000" as Address, symbol: "Select token", decimals: 18 });
  const [toChainId, setToChainId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  useEffect(() => { setToChainId(chainId); }, [chainId]);

 
  const [slipMode, setSlipMode] = useState<SlippageMode>("auto");
  const [slippage, setSlippage] = useState<number>(0.5);
  const [deadlineMin, setDeadlineMin] = useState<number>(20);
  const [expertMode, setExpertMode] = useState(false);
  const [disableMultihops, setDisableMultihops] = useState(false);
  const [gasPreset, setGasPreset] = useState<GasPreset>("default");
  const [mevProtect, setMevProtect] = useState<boolean>(false);

  const [resolvedSlipPct, setResolvedSlipPct] = useState<number>(1);
  const [resolvedSlipBps, setResolvedSlipBps] = useState<number>(100);

 
  const [txBusy, setTxBusy] = useState(false);
  const [txModal, setTxModal] = useState<{ open: boolean; kind: TxModalKind; title: string; subtitle?: string; hash?: string; }>({ open: false, kind: "waiting", title: "" });
  const closeTxModal = () => setTxModal((m) => ({ ...m, open: false }));

  
  const [picker, setPicker] = useState<null | { side: "from" | "to" }>(null);
  const [openSettings, setOpenSettings] = useState(false);

  const fees = useGas(chainId, gasPreset);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPicker(null); };
    document.addEventListener("keydown", onKey);
    if (picker) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [picker]);

 
  const srcChainId = chainId;
  const dstChainId = toChainId ?? chainId;
  const toChainMeta = CHAINS.find((c) => c.chainId === dstChainId) || chain;

  const fromMeta = useTokenMeta(srcChainId, fromToken.address === "native" ? null : (fromToken.address as Address), { symbol: fromToken.symbol, decimals: fromToken.decimals });
  const toMeta   = useTokenMeta(dstChainId, toToken.address   === "native" ? null : (toToken.address as Address),   { symbol: toToken.symbol,   decimals: toToken.decimals   });

  useEffect(() => { if (fromToken.address !== "native") setFromToken((t) => ({ ...t, symbol: fromMeta.symbol ?? t.symbol, decimals: fromMeta.decimals ?? t.decimals })); }, [fromMeta.symbol, fromMeta.decimals, fromToken.address]);
  useEffect(() => { if (toToken.address   !== "native") setToToken((t) => ({ ...t,   symbol: toMeta.symbol   ?? t.symbol,   decimals: toMeta.decimals   ?? t.decimals   })); }, [toMeta.symbol, toMeta.decimals, toToken.address]);

  const wNativeSrc = asAddr(WNATIVE[srcChainId]);
  const wNativeDst = asAddr(WNATIVE[dstChainId]);

  const inAddr  = fromToken.address === "native" ? wNativeSrc : asAddr(fromToken.address as string);
  const outAddr = toToken.address   === "native" ? wNativeDst : asAddr(toToken.address   as string);

  const isCross = srcChainId !== dstChainId;

 
  const isNativeIn  = fromToken.address === "native";
  const isNativeOut = toToken.address   === "native";

  const safeIn  = inAddr  && inAddr  !== zeroAddress ? inAddr  : undefined;
  const safeOut = outAddr && outAddr !== zeroAddress ? outAddr : undefined;

  const isWrap   = isNativeIn  && !!safeOut && !!wNativeSrc && addrEq(safeOut, wNativeSrc);
  const isUnwrap = !isNativeIn && isNativeOut && !!safeIn   && !!wNativeSrc && addrEq(safeIn,  wNativeSrc);
  const isWrapCase = isWrap || isUnwrap;

 
  const sameToken = !isCross && !!safeIn && !!safeOut && addrEq(safeIn, safeOut) && !isWrapCase;

  const inTaxPct  = useTokenTax(srcChainId, fromToken.address === "native" ? null : (fromToken.address as Address));
  const outTaxPct = useTokenTax(dstChainId, toToken.address   === "native" ? null : (toToken.address   as Address));
  const detectedTaxPct = Math.max(inTaxPct ?? 0, outTaxPct ?? 0);
  const autoSlip  = resolveAutoSlippage(detectedTaxPct);
  const autoPreviewPct = autoSlip.mode === "safe" ? Number(autoSlip.pct.toFixed(2)) : undefined;

  useEffect(() => {
    let pct = resolvedSlipPct;
    if (slipMode === "auto") pct = autoSlip.mode === "safe" ? autoSlip.pct : 0;
    else if (slipMode === "fixed") pct = Number(Math.min(50, Math.max(0, slippage)).toFixed(2));
    else pct = Number(Math.min(50, Math.max(0, resolvedSlipPct)).toFixed(2));
    const bps = Math.round(pct * 100);
    if (pct !== resolvedSlipPct) setResolvedSlipPct(pct);
    if (bps !== resolvedSlipBps) setResolvedSlipBps(bps);
  }, [slipMode, slippage, autoSlip, srcChainId, dstChainId, inAddr, outAddr]); 

  
  const canSwapBase = useMemo(() => Number(amount) > 0 && !!safeIn && !!safeOut && !sameToken, [amount, safeIn, safeOut, sameToken]);

  const { loading: qLoading, error: qError, quote } = useBestQuote({
    chainId: srcChainId,
    tokenIn:  (safeIn  ?? wNativeSrc!) as Address,
    tokenOut: (safeOut ?? wNativeDst!) as Address,
    amountInFloat: amount || "0",
    decimalsIn: fromToken.decimals ?? 18,
    slippageBps: resolvedSlipBps,
    enabled: !!safeIn && !!safeOut && !isCross && !isWrapCase,
    blindMinOut: slipMode === "auto" && autoSlip.mode === "blind",
  });

  
  const amountInBig = (() => { try { return parseUnits((amount || "0") as `${number}`, fromToken.decimals ?? 18); } catch { return 0n; } })();
  const wrapVirtualQuote = isWrapCase && amountInBig > 0n && wNativeSrc
    ? { proto: "v2" as const, amountOut: amountInBig, amountOutMin: amountInBig, path: [wNativeSrc] as Address[] }
    : null;

  const effQuote = wrapVirtualQuote || quote;

  const crossEst = useCrossEstimate({
    srcChainId, dstChainId,
    tokenIn:  (safeIn  ?? wNativeSrc!) as Address,
    tokenOut: (safeOut ?? wNativeDst!) as Address,
    amountInFloat: amount || "0",
    decimalsIn: fromToken.decimals ?? 18,
    enabled: !!safeIn && !!safeOut && isCross,
  });

 
  const pcSrc = usePublicClient({ chainId: srcChainId });
  const pcDst = usePublicClient({ chainId: dstChainId });

const {
  data: fromBal,
  isLoading: fromBalLoading,
  refetch: refetchFromBal,
} = useBalance({
  address,
  chainId: srcChainId,
  token: fromToken.address === "native" ? undefined : (fromToken.address as Address),
  scopeKey: `from-${srcChainId}-${fromToken.address}`,
  query: { enabled: !!address },
});

const {
  data: toBal,
  isLoading: toBalLoading,
  refetch: refetchToBal,
} = useBalance({
  address,
  chainId: dstChainId,
  token: toToken.address === "native" ? undefined : (toToken.address as Address),
  scopeKey: `to-${dstChainId}-${toToken.address}`,
  query: { enabled: !!address && !!toToken },
});

 
  const burstTimers = useRef<number[]>([]);
  const clearBurst = () => {
    burstTimers.current.forEach((id) => window.clearTimeout(id));
    burstTimers.current = [];
  };
  const refreshBalancesBurst = () => {
    refetchFromBal?.(); refetchToBal?.();
    clearBurst();
    burstTimers.current.push(window.setTimeout(() => { refetchFromBal?.(); refetchToBal?.(); }, 1200));
    burstTimers.current.push(window.setTimeout(() => { refetchFromBal?.(); refetchToBal?.(); }, 3000));
    burstTimers.current.push(window.setTimeout(() => { refetchFromBal?.(); refetchToBal?.(); }, 6000));
  };
  useEffect(() => () => clearBurst(), []);

  
  useEffect(() => {
    if (!address) return;
    const offs: Array<() => void> = [];

    const watchToken = (client: any, token?: Address) => {
      if (!client || !token) return;
      
      offs.push(client.watchContractEvent({
        address: token,
        abi: erc20Abi,
        eventName: "Transfer",
        args: { from: address as Address },
        onLogs: () => refreshBalancesBurst(),
      }));
      
      offs.push(client.watchContractEvent({
        address: token,
        abi: erc20Abi,
        eventName: "Transfer",
        args: { to: address as Address },
        onLogs: () => refreshBalancesBurst(),
      }));
    };

    
    if (fromToken.address !== "native") watchToken(pcSrc, asAddr(fromToken.address as string));
    if (toToken.address   !== "native") watchToken(pcDst, asAddr(toToken.address as string));

    return () => { offs.forEach((off) => { try { off?.(); } catch {} }); };
  }, [address, pcSrc, pcDst, fromToken.address, toToken.address]);

  function onSwitch() {
    if (txBusy) return;
    const a = fromToken;
    setFromToken(toToken);
    setToToken(a);
  }

  const srcNativeSym = (CHAINS.find((c) => c.chainId === srcChainId) || chain).native;
  const fromSym = fromToken.address === "native" ? srcNativeSym : fromToken.symbol || "TOKEN";
  const toSym   = toToken.address   === "native" ? toChainMeta.native : toToken.symbol || "TOKEN";
  const fromLogo = fromToken.address === "native" ? NATIVE_LOGO[srcChainId] : fromToken.logo;
  const toLogo   = toToken.address   === "native" ? NATIVE_LOGO[dstChainId] : toToken.logo;

  const getFromBalNumber = () => Number(fromBal?.formatted ?? 0);
  const miniBal = (isFrom: boolean) =>
    isFrom ? (fromBalLoading ? "…" : fromBal ? fmt.format(Number(fromBal.formatted)) : "0")
           : (toBalLoading   ? "…" : toBal   ? fmt.format(Number(toBal.formatted))   : "0");

  const setAmountPct = (pct: number) => {
    const bal = getFromBalNumber();
    const base = fromToken.address === "native" ? Math.max(0, bal - gasReserve(srcChainId)) : bal;
    const val = base * pct;
    setAmount(val > 0 ? String(+val.toFixed(6)) : "0");
  };
  const setAmountMax = () => setAmountPct(1);

  const minRecv = effQuote ? fmt.format(scaleDown(effQuote.amountOutMin, toToken.decimals)) : "-";

  const routeSymbols = (() => {
    if (isWrap) return `Wrap ${srcNativeSym} → W${srcNativeSym}`;
    if (isUnwrap) return `Unwrap W${srcNativeSym} → ${srcNativeSym}`;
    if (!effQuote) return "";
    const map = new Map<string, string>();
    if (wNativeSrc) map.set(wNativeSrc.toLowerCase(), srcNativeSym);
    map.set((fromToken.address === "native" ? (wNativeSrc || "") : (fromToken.address as string)).toLowerCase(), fromSym);
    map.set((toToken.address   === "native" ? (wNativeDst || "") : (toToken.address   as string)).toLowerCase(), toSym);
    return effQuote.path.map((a) => map.get(a.toLowerCase()) || a.slice(0, 4) + "…" + a.slice(-3)).join(" › ");
  })();

  const fromBalNumber = getFromBalNumber();
  const amountNum = Number(amount || 0);
  const effAvailNative = fromToken.address === "native" ? Math.max(0, fromBalNumber - gasReserve(srcChainId)) : fromBalNumber;
  const insufficient = !(amountNum > 0) || amountNum > effAvailNative;

 
  const slippageErrorText = (() => {
    if (isWrapCase) return null;
    if (slipMode === "auto" && autoSlip.mode === "blind") return null;
    const pct = resolvedSlipPct;
    if (!(pct >= 0 && pct <= 50)) return "Slippage out of bounds (0%–50%).";
    if (slipMode !== "auto") {
      const needed = Math.max(inTaxPct ?? 0, outTaxPct ?? 0);
      if (pct + 1e-9 < needed) return `Slippage too small for token tax ${needed.toFixed(2)}%.`;
    }
    return null;
  })();

  
  const swapEnabled =
    isConnected &&
    !!fees &&
    (isWrapCase ? Number(amount) > 0 : canSwapBase) &&
    !qLoading &&
    !txBusy &&
    !insufficient &&
    !isCross &&
    !slippageErrorText &&
    (!!effQuote || isWrapCase) &&
    (isWrapCase || (effQuote!.amountOut > 0n));

  const primaryCtaText =
    !isConnected ? "Connect wallet"
    : isCross ? "CROSS CHAIN IS COMING SOON"
    : amountNum <= 0 ? "Enter an amount"
    : insufficient ? (fromToken.address === "native" ? `Insufficient ${srcNativeSym}` : `Insufficient ${fromSym}`)
    : qLoading && !effQuote && !isWrapCase ? "Finding best price …"
    : slippageErrorText ? "Invalid Slippage"
    : isWrap ? "Wrap"
    : isUnwrap ? "Unwrap"
    : sameToken ? "Select different tokens"
    : "Swap";


  function humanizeError(e: any): string {
    const msg = (e?.shortMessage || e?.message || "").toLowerCase();
    if (msg.includes("address") && msg.includes("invalid"))
      return "Invalid contract address for the selected chain. Make sure wallet & UI are on the same network.";
    if (msg.includes("user rejected") || msg.includes("rejected the request"))
      return "You rejected the transaction in your wallet.";
    if (msg.includes("chain mismatch") || msg.includes("wrong network") || msg.includes("switch the network"))
      return "Your wallet is on a different network. Switch to the selected chain and try again.";
    if (msg.includes("insufficient funds") || msg.includes("exceeds balance"))
      return "Insufficient balance to complete this transaction.";
    if (isMinOutRevert(msg)) return "Price moved more than your slippage tolerance.";
    if (msg.includes("transferhelper") || msg.includes("allowance"))
      return "Token allowance is insufficient.";
    if (msg.includes("deadline") || msg.includes("expired")) return "Transaction deadline exceeded.";
    return e?.shortMessage || e?.message || "Transaction failed. Please try again or adjust your settings.";
  }

  
  async function ensureChain(targetChainId: number) {
    const current =
      (walletClient as any)?.chain?.id ??
      (typeof (walletClient as any)?.getChainId === "function" ? await (walletClient as any).getChainId() : walletChainId);
    if (current === targetChainId) return;

    if ((walletClient as any)?.switchChain) {
      try { await (walletClient as any).switchChain({ chainId: targetChainId }); return; }
      catch (e: any) {
        const msg = String(e?.message || e).toLowerCase();
        if (msg.includes("user rejected")) throw e;
        const targetName = CHAINS.find((c) => c.chainId === targetChainId)?.name ?? `chain ${targetChainId}`;
        throw new Error(`Please manually switch your wallet to ${targetName}.`);
      }
    } else {
      const targetName = CHAINS.find((c) => c.chainId === targetChainId)?.name ?? `chain ${targetChainId}`;
      throw new Error(`Please manually switch your wallet to ${targetName}.`);
    }
  }


  const onSwapClick = async () => {
    if (!swapEnabled || insufficient) return;
    try {
      if (!walletClient || !pc || !address) return;

      
      await ensureChain(srcChainId);

      
      if (isCross) {
        setTxModal({ open: true, kind: "error", title: "Cross-chain disabled", subtitle: "CROSS CHAIN IS COMING SOON" });
        return;
      }
      
      if (slippageErrorText) {
        setTxModal({ open: true, kind: "error", title: "Invalid slippage", subtitle: slippageErrorText });
        return;
      }

      const amountIn = parseUnits((amount || "0") as `${number}`, fromToken.decimals ?? 18);
      const now = Math.floor(Date.now() / 1000);
      const deadline = BigInt(now + Math.max(1, deadlineMin) * 60);

      
      if (isWrapCase) {
        const waddr = wNativeSrc;
        if (!waddr) throw new Error(`Wrapped native not configured for chain ${srcChainId}.`);

        if (isWrap) {
          const { request } = await (pc as any).simulateContract({ account: address, address: waddr, abi: WNATIVE_ABI, functionName: "deposit", args: [], value: amountIn });
          setTxBusy(true);
          setTxModal({ open: true, kind: "waiting", title: "Wrapping…", subtitle: "Confirm in your wallet" });
          const txHash = await walletClient.writeContract(request);
          setTxModal({ open: true, kind: "pending", title: "Processing…", hash: String(txHash) });
          const receipt = await (pc as any).waitForTransactionReceipt({ hash: txHash });
          setTxModal({ open: true, kind: "success", title: "Wrapped", hash: String(receipt.transactionHash) });
          refreshBalancesBurst();
          setTxBusy(false);
          return;
        } else {
          const { request } = await (pc as any).simulateContract({ account: address, address: waddr, abi: WNATIVE_ABI, functionName: "withdraw", args: [amountIn] });
          setTxBusy(true);
          setTxModal({ open: true, kind: "waiting", title: "Unwrapping…", subtitle: "Confirm in your wallet" });
          const txHash = await walletClient.writeContract(request);
          setTxModal({ open: true, kind: "pending", title: "Processing…", hash: String(txHash) });
          const receipt = await (pc as any).waitForTransactionReceipt({ hash: txHash });
          setTxModal({ open: true, kind: "success", title: "Unwrapped", hash: String(receipt.transactionHash) });
          refreshBalancesBurst(); 
          setTxBusy(false);
          return;
        }
      }

      
      if (!effQuote) {
        setTxModal({ open: true, kind: "error", title: "Route not available", subtitle: "Liquidity is missing or slippage is too strict." });
        return;
      }
      if (effQuote.amountOut <= 0n || effQuote.amountOutMin <= 0n) {
        setTxModal({ open: true, kind: "error", title: "Invalid route/slippage", subtitle: "Increase slippage or change token pair." });
        return;
      }
      if (effQuote.amountOut < effQuote.amountOutMin) {
        setTxModal({ open: true, kind: "error", title: "Slippage too low", subtitle: "Minimum received exceeds the estimate. Increase slippage or switch to AUTO." });
        return;
      }

      const router = asAddr(ROUTER_V2[srcChainId]);
      if (!router) {
        setTxModal({ open: true, kind: "error", title: "Router not configured", subtitle: "V2 router is not configured for this chain." });
        return;
      }

      const path = effQuote.path ?? (safeIn && safeOut ? [safeIn, safeOut] : []);
      if (path.length === 0) {
        setTxModal({ open: true, kind: "error", title: "Invalid path", subtitle: "Token path is invalid for the selected chain." });
        return;
      }

      
      if (!isNativeIn) {
        const tokenAddr = safeIn;
        if (!tokenAddr) throw new Error("Input token address invalid.");
        const allowance: bigint = (await (pc as any).readContract({ address: tokenAddr as Address, abi: erc20Abi, functionName: "allowance", args: [address, router], })) as unknown as bigint;

        if (allowance < amountIn) {
          setTxModal({ open: true, kind: "waiting", title: "Approve token", subtitle: "Please confirm the token approval in your wallet…" });
          const approveHash = await walletClient.writeContract({ address: tokenAddr as Address, abi: erc20Abi, functionName: "approve", args: [router, maxUint256], account: address });
          await (pc as any).waitForTransactionReceipt({ hash: approveHash });
          setTxModal((m) => ({ ...m, open: false }));
          
        }
      }

      
      let sim: { request: any } | undefined;
      try {
        if (isNativeIn) {
          sim = await (pc as any).simulateContract({
            account: address, address: router, abi: V2SwapSupportingAbi, functionName: "swapExactETHForTokensSupportingFeeOnTransferTokens",
            args: [effQuote.amountOutMin, path, address as Address, deadline], value: amountIn,
          });
        } else if (isNativeOut) {
          sim = await (pc as any).simulateContract({
            account: address, address: router, abi: V2SwapSupportingAbi, functionName: "swapExactTokensForETHSupportingFeeOnTransferTokens",
            args: [amountIn, effQuote.amountOutMin, path, address as Address, deadline],
          });
        } else {
          sim = await (pc as any).simulateContract({
            account: address, address: router, abi: V2SwapSupportingAbi, functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
            args: [amountIn, effQuote.amountOutMin, path, address as Address, deadline],
          });
        }
      } catch (simErr: any) {
        setTxModal({
          open: true, kind: "error", title: "Simulation failed",
          subtitle: isMinOutRevert(simErr?.message?.toLowerCase?.())
            ? "Price moved beyond your slippage. Increase slippage or reduce amount."
            : (simErr?.shortMessage || simErr?.message || "This transaction would likely fail."),
        });
        return;
      }

     
      setTxBusy(true);
      setTxModal({ open: true, kind: "waiting", title: "Waiting for confirmation", subtitle: "Please confirm the transaction in your wallet…" });

      const txHash = await walletClient.writeContract(sim!.request);
      setTxModal({ open: true, kind: "pending", title: "Processing…", subtitle: "Your transaction is being confirmed on-chain.", hash: String(txHash) });

      const receipt = await (pc as any).waitForTransactionReceipt({ hash: txHash! });
      setTxModal({ open: true, kind: "success", title: "Confirmed", subtitle: "Your swap was successfully confirmed.", hash: String(receipt.transactionHash) });

      
      refreshBalancesBurst();
    } catch (e: any) {
      setTxModal({ open: true, kind: "error", title: "Transaction failed", subtitle: humanizeError(e) });
      console.error("Swap failed:", e?.shortMessage || e?.message || e);
    } finally {
      setTxBusy(false);
    }
  };

  return (
    <div className="adex-v1 small">
      <div className="card">
        <div className="head">
          <div>
            <div className="title">Multichain Swap</div>
            <div className="sub">Trade tokens in an instant</div>
          </div>
        <button className="icon-btn" onClick={() => setOpenSettings(true)}>
            <img src={iconSettings} alt="" />
          </button>
        </div>


        <div className="box">
          <div className="box-top">From</div>
          <div className="box-row">
            <input className="amt" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" disabled={txBusy} />
            <button className={"token" + (sameToken ? " muted" : "")} onClick={() => !txBusy && setPicker({ side: "from" })} disabled={txBusy}>
              {fromLogo ? <img className="tk" src={fromLogo} /> : null}
              <span>{fromSym}</span>
              <span className="car">▾</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="chip small" onClick={() => setAmountPct(0.1)} disabled={txBusy}>10%</button>
            <button className="chip small" onClick={() => setAmountPct(0.5)} disabled={txBusy}>50%</button>
            <button className="chip small" onClick={setAmountMax} disabled={txBusy}>MAX</button>
          </div>

          <div className="box-foot">{miniBal(true)}</div>
        </div>


        <div className="switch-wrap">
          <button className="switch" onClick={onSwitch} aria-label="Switch tokens" disabled={txBusy}>
            <img src={iconArrow} alt="" />
          </button>
        </div>


        <div className="box">
          <div className="box-top">To</div>
          <div className="box-row">
            <div className="amt ro">
              {isCross
                ? crossEst.loading
                  ? "0.0"
                  : crossEst.amountOut
                  ? scaleDown(crossEst.amountOut, toToken.decimals).toFixed(6)
                  : "0.0"
                : qLoading && !effQuote && !isWrapCase
                ? "0.0"
                : effQuote
                ? scaleDown(effQuote.amountOut, toToken.decimals).toFixed(6)
                : isWrapCase
                ? amount || "0.0"
                : "0.0"}
            </div>
            <button className={"token" + (sameToken ? " muted" : "")} onClick={() => !txBusy && setPicker({ side: "to" })} disabled={txBusy}>
              {toLogo ? <img className="tk" src={toLogo} /> : null}
              <span>{toSym}</span>
              <span className="car">▾</span>
            </button>
          </div>
          <div className="box-foot">{miniBal(false)}</div>

          {sameToken ? <div className="tiny-err" style={{ marginTop: 8 }}>From and To cannot be the same token.</div> : null}
        </div>


        <button className={"cta " + (swapEnabled ? "go" : "") + (txBusy ? " loading" : "")} disabled={!swapEnabled} onClick={onSwapClick} title={isCross ? "CROSS CHAIN IS COMING SOON" : undefined}>
          {primaryCtaText}
          {txBusy ? <span className="spinner" /> : null}
        </button>


        <div className="trade-details under">
          {!isCross ? (
            qLoading && !effQuote && !isWrapCase ? (
              <div className="row finding">
                <span>Finding best price</span>
                <span className="dots"><i>.</i><i>.</i><i>.</i></span>
              </div>
            ) : (
              <>
                <div className="row">
                  <span>Minimum received</span>
                  <strong>{minRecv} {toSym}</strong>
                </div>
                <div className="row">
                  <span>Route</span>
                  <span className="route">{routeSymbols || "-"}</span>
                </div>
              </>
            )
          ) : (
            <>
              <div className="row"><span>Status</span><strong>Cross-chain is coming soon</strong></div>
              <div className="row"><span>Destination</span><strong>{toChainMeta.name}</strong></div>
            </>
          )}
          <div className="row">
            <span>Slippage</span>
            <span>
              {isWrapCase ? "— (wrap/unwrap 1:1)"
              : slipMode === "auto"
                ? (autoSlip.mode === "safe" ? `${resolvedSlipPct}% (AUTO safe)` : `AUTO`)
                : `${resolvedSlipPct}% (${slipMode.toUpperCase()})`}
            </span>
          </div>
          <div className="row">
            <span>Enable MEV Protect</span>
            <label className="mev-toggle">
              <input type="checkbox" checked={mevProtect} onChange={(e) => setMevProtect(e.target.checked)} disabled={txBusy} />
              <i /><b>{mevProtect ? "ON" : "OFF"}</b>
            </label>
          </div>
          <div className="row">
            <span>Tx Speed (GWEI)</span>
            <span>
              {fees?.type === "eip1559"
                ? `Speed ${(Number(fees?.maxFeePerGas ?? 0) / 1e9).toFixed(3)} • prio ${(Number(fees?.maxPriorityFeePerGas ?? 0) / 1e9).toFixed(3)} (${gasPreset})`
                : `gasPrice ${(Number(fees?.gasPrice ?? 0) / 1e9).toFixed(3)} (${gasPreset})`}
            </span>
          </div>
          {slippageErrorText ? <div className="tiny-err" style={{ marginTop: 8 }}>{slippageErrorText}</div> : null}
          {qError && !qLoading && !effQuote && !isCross && !isWrapCase ? <div className="tiny-err" style={{ marginTop: 8 }}>{qError}</div> : null}
        </div>
      </div>


      <SettingsModal
        open={openSettings}
        initial={{ slippageMode: slipMode, slippage, deadlineMin, expertMode, disableMultihops, gasPreset }}
        onClose={() => setOpenSettings(false)}
        onApply={(v) => {
          setSlipMode(v.slippageMode);
          setSlippage(v.slippage);
          setDeadlineMin(v.deadlineMin);
          setExpertMode(v.expertMode);
          setDisableMultihops(v.disableMultihops);
          setGasPreset(v.gasPreset);
          setResolvedSlipPct(v.resolvedSlippagePct);
          setResolvedSlipBps(v.resolvedSlippageBps);
        }}
        autoPreviewPct={autoPreviewPct}
      />


      {picker && (
        <>
          <div className="modal-backdrop" onClick={() => setPicker(null)} />
          <div className="modal-legacy tkselect-offset">
            {picker.side === "from" ? (
<TokenSelect
  side="from"
  connectedChainId={walletChainId}
  onClose={() => setPicker(null)}
  onPick={({ address, symbol, logo }) => {
    const blocked = toToken.address === "native" ? undefined : (toToken.address as Address);
    if (blocked && addrEq(address as Address, blocked)) { setPicker(null); return; }
    setFromToken({ address, symbol, decimals: 18, logo } as any);
    setPicker(null);
  }}
/>
            ) : (
<TokenSelect
  side="to"
  connectedChainId={walletChainId}
  initialChainId={srcChainId}
  onClose={() => setPicker(null)}
  onPick={({ chainId: pickedChainId, address, symbol, logo }) => {
    const blocked = fromToken.address === "native" ? undefined : (fromToken.address as Address);
    if (blocked && addrEq(address as Address, blocked)) { setPicker(null); return; }
    setToChainId(pickedChainId);
    setToToken({ address, symbol, decimals: 18, logo } as any);
    setPicker(null);
  }}
/>

            )}
          </div>
        </>
      )}

      
      <TxModal open={txModal.open} kind={txModal.kind} title={txModal.title} subtitle={txModal.subtitle} hash={txModal.hash} onClose={closeTxModal} />
    </div>
  );
}
