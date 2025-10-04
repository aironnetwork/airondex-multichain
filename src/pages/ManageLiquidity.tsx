import { useEffect, useMemo, useState } from "react";
import "./ManageLiquidity.css";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { formatUnits, getAddress, parseUnits } from "viem";
import { useNavigate } from "react-router-dom";

import TokenIcon from "../components/TokenIcon";
import defaultLogo from "../assets/token/default.png";


import notFoundImg from "../assets/liquidity/notfound.png";


import okIcon from "../assets/liquidity/confirmed.png";
import failIcon from "../assets/liquidity/failed.png";


import bnbLogo from "../assets/chain/bnb.png";
import ethLogo from "../assets/chain/ethereum.png";
import arbLogo from "../assets/chain/arbitrum.png";
import baseLogo from "../assets/chain/base.png";
import bnbtLogo from "../assets/chain/bnb.png";
import sepoliaLogo from "../assets/chain/ethereum.png";
import arbTestLogo from "../assets/chain/arbitrum.png";
import baseTestLogo from "../assets/chain/base.png";
import aironLogo from "../assets/chain/airon.png";


import { ERC20_ABI, PAIR_V2_ABI } from "../abis/liquidity";


import { fetchPancakeBalances } from "../web3/pancake";


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
  lpAddr: Address;
  tokenA: SelToken;
  tokenB: SelToken;
  amountA: string;
  amountB: string;
  lpShares: string;
  ts: number;
};

const CHAIN_META: Record<number, { name: string; logo: string }> = {
  56: { name: "BNB Chain", logo: bnbLogo },
  1: { name: "Ethereum", logo: ethLogo },
  42161:{ name: "Arbitrum", logo: arbLogo },
  8453: { name: "Base", logo: baseLogo },
  97:  { name: "BNB Testnet", logo: bnbtLogo },
  11155111:{ name: "ETH Sepolia", logo: sepoliaLogo },
  421614:{ name: "ARB Testnet", logo: arbTestLogo },
  84532:{ name: "Base Testnet", logo: baseTestLogo },
  2030: { name: "Airon Testnet", logo: aironLogo },
};

const MULTICALL3: Record<number, Address | null> = {
  1:        "0xCA11bde05977b3631167028862be2a173976CA11",
  56:       "0xCA11bde05977b3631167028862be2a173976CA11",
  8453:     "0xCA11bde05977b3631167028862be2a173976CA11",
  42161:    "0xCA11bde05977b3631167028862be2a173976CA11",
  2030:     "0x9a7a0B49C1316c09Dd157D77fcE326e073b2CE92",
  97:       "0x1cb4a8D5852AB2359216DDbBf81bdc2cFb0943Ec",
  11155111: "0xcA11bde05977b3631167028862bE2a173976CA11",
  84532:    "0xcA11bde05977b3631167028862bE2a173976CA11",
  421614:   "0xcA11bde05977b3631167028862bE2a173976CA11",
};

const FACTORY_BY_CHAIN: Record<number, Address | undefined> = {
  56:        "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  1:         "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  8453:      "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  42161:     "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  97:        "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
  11155111:  "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
  421614:    "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  84532:     "0x02a84c1b3BBD7401a5f7fa98a384EBC70bB5749E",
  2030:      "0xA65CB0c559aA59dcB40e256A2DBAAa403181Bd11",
} as const;

const ROUTER_BY_CHAIN: Record<number, Address | undefined> = {
  1:        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  56:       "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  8453:     "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  42161:    "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  97:       "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  11155111: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  421614 :  "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  84532  :  "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb",
  2030:     "0x224cd6F72660fE1eFA650255a2bCa9670b4d38c1",
};

const FACTORY_MIN_ABI = [
  { inputs:[], name:"allPairsLength", outputs:[{type:"uint256"}], stateMutability:"view", type:"function" },
  { inputs:[{type:"uint256"}], name:"allPairs", outputs:[{type:"address"}], stateMutability:"view", type:"function" }
] as const;

const ROUTER_V2_MIN_ABI = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "removeLiquidity",
    inputs: [
      { name:"tokenA", type:"address" },
      { name:"tokenB", type:"address" },
      { name:"liquidity", type:"uint256" },
      { name:"amountAMin", type:"uint256" },
      { name:"amountBMin", type:"uint256" },
      { name:"to", type:"address" },
      { name:"deadline", type:"uint256" },
    ],
    outputs: [{ type:"uint256", name:"amountA" }, { type:"uint256", name:"amountB" }]
  },
] as const;

const posKey = (addr?: string, chainId?: number) =>
  addr && chainId ? `airon.lp.positions.${addr.toLowerCase()}.${chainId}` : "";

function short(n: string | number, dp = 6) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return x.toLocaleString(undefined, { maximumFractionDigits: dp });
}

/** toast */
type Toast = { id: number; kind: "info"|"success"|"error"; text: string };
let nextToastId = 1;

export default function ManageLiquidityPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();


  const [query, setQuery] = useState("");
  const [onlyCurrentChain, setOnlyCurrentChain] = useState(true);


  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [usedFallbackSeq, setUsedFallbackSeq] = useState(false);


  const [manageId, setManageId] = useState<string | null>(null);
  const [mode, setMode] = useState<"choose" | "remove">("choose");
  const [rangePct, setRangePct] = useState(25);
  const [txNote, setTxNote] = useState<string | null>(null);
  const [txBusy, setTxBusy] = useState(false);

 
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (kind: Toast["kind"], text: string) => {
    const id = nextToastId++;
    setToasts(t => [...t, { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  async function runMulticallOrSequential<T extends { address: Address; abi: any; functionName: string; args?: any[] }>(
    contracts: T[]
  ): Promise<Array<{ status: "success" | "failure"; result?: any }>> {
    if (!publicClient) return contracts.map(()=>({status:"failure" as const}));
    try {
      const mcAddr = MULTICALL3[chainId] || undefined;
      const res = await publicClient.multicall({ contracts: contracts as any, allowFailure: true, multicallAddress: mcAddr });
      return res.map((r: any) => (r?.status === "success" ? { status: "success", result: r.result } : { status: "failure" }));
    } catch {
      setUsedFallbackSeq(true);
      const out: Array<{ status: "success" | "failure"; result?: any }> = [];
      for (const c of contracts) {
        try {
          const result = await publicClient.readContract({ address: c.address, abi: c.abi, functionName: c.functionName, args: c.args as any });
          out.push({ status: "success", result });
        } catch { out.push({ status: "failure" }); }
      }
      return out;
    }
  }

  
  useEffect(() => {
    (async () => {
      setLoading(true);
      setNote(null);
      setUsedFallbackSeq(false);
      try {
        if (!isConnected || !address || !publicClient) {
          const k = posKey(address, chainId);
          const arr: Position[] = k ? JSON.parse(localStorage.getItem(k) || "[]") : [];
          arr.sort((a, b) => (b.ts - a.ts));
          setPositions(arr);
          return;
        }

        const nextPositions: Position[] = [];
        let usedApi = false;

       
        try {
          const { tokens } = await fetchPancakeBalances({ address });
          const onThisChain = tokens.filter((t: any) =>
            (!t.chainId || t.chainId === chainId) && BigInt(t.balance || "0") > 0n
          );

          if (onThisChain.length > 0) {
            const pairAddrs = onThisChain.map((t: any) => getAddress(t.address));
            const calls = pairAddrs.flatMap((addr) => ([
              { address: addr, abi: PAIR_V2_ABI, functionName: "token0" as const },
              { address: addr, abi: PAIR_V2_ABI, functionName: "token1" as const },
              { address: addr, abi: PAIR_V2_ABI, functionName: "getReserves" as const },
              { address: addr, abi: PAIR_V2_ABI, functionName: "totalSupply" as const },
            ]));
            const res = await runMulticallOrSequential(calls);

            type PairInfo = {
              addr: Address; isPair: boolean;
              token0?: Address; token1?: Address;
              reserve0?: bigint; reserve1?: bigint;
              totalSupply?: bigint; userLP: bigint;
            };

            const pairs: PairInfo[] = [];
            for (let i = 0; i < pairAddrs.length; i++) {
              const base = i * 4;
              const r0 = res[base + 0], r1 = res[base + 1], rr = res[base + 2], ts = res[base + 3];
              const ok = r0.status === "success" && r1.status === "success" && rr.status === "success" && ts.status === "success";
              pairs.push({
                addr: pairAddrs[i],
                isPair: ok,
                token0: ok ? (r0.result as Address) : undefined,
                token1: ok ? (r1.result as Address) : undefined,
                reserve0: ok ? (rr.result as any)[0] as bigint : undefined,
                reserve1: ok ? (rr.result as any)[1] as bigint : undefined,
                totalSupply: ok ? (ts.result as bigint) : undefined,
                userLP: BigInt(onThisChain[i].balance || "0"),
              });
            }

            const real = pairs.filter(p => p.isPair && p.totalSupply! > 0n && p.userLP > 0n) as Required<PairInfo>[];
            if (real.length > 0) {
              const metaCalls = real.flatMap(p => ([
                { address: p.token0, abi: ERC20_ABI, functionName: "decimals" as const },
                { address: p.token0, abi: ERC20_ABI, functionName: "symbol"   as const },
                { address: p.token0, abi: ERC20_ABI, functionName: "name"     as const },
                { address: p.token1, abi: ERC20_ABI, functionName: "decimals" as const },
                { address: p.token1, abi: ERC20_ABI, functionName: "symbol"   as const },
                { address: p.token1, abi: ERC20_ABI, functionName: "name"     as const },
              ]));
              const metaRes = await runMulticallOrSequential(metaCalls);

              for (let i = 0; i < real.length; i++) {
                const p = real[i];
                const m = metaRes.slice(i*6, i*6 + 6);
                const d0 = m[0].status === "success" ? Number(m[0].result as bigint) : 18;
                const s0 = m[1].status === "success" ? String(m[1].result) : "T0";
                const n0 = m[2].status === "success" ? String(m[2].result) : s0;
                const d1 = m[3].status === "success" ? Number(m[3].result as bigint) : 18;
                const s1 = m[4].status === "success" ? String(m[4].result) : "T1";
                const n1 = m[5].status === "success" ? String(m[5].result) : s1;

                const amt0 = (p.reserve0 * p.userLP) / p.totalSupply;
                const amt1 = (p.reserve1 * p.userLP) / p.totalSupply;

                nextPositions.push({
                  id: `${chainId}:${String(p.token0)}:${String(p.token1)}`,
                  chainId,
                  lpAddr: getAddress(p.addr),
                  tokenA: { chainId, address: p.token0, symbol: s0, name: n0, logo: defaultLogo },
                  tokenB: { chainId, address: p.token1, symbol: s1, name: n1, logo: defaultLogo },
                  amountA: formatUnits(amt0, d0),
                  amountB: formatUnits(amt1, d1),
                  lpShares: formatUnits(p.userLP, 18),
                  ts: Date.now(),
                });
              }
            }
            usedApi = true;
          }
        } catch {
          // fallthrough
        }

       
        if (nextPositions.length === 0) {
          const factory = FACTORY_BY_CHAIN[chainId];
          if (!factory) throw new Error("Factory address missing for this chain");

          const pairsLen = (await publicClient.readContract({
            address: factory,
            abi: FACTORY_MIN_ABI,
            functionName: "allPairsLength",
          })) as bigint;

          const len = Number(pairsLen || 0n);
          if (len > 0) {
            const CHUNK = 250;
            const pairAddrs: Address[] = [];
            for (let start = 0; start < len; start += CHUNK) {
              const end = Math.min(len, start + CHUNK);
              const calls = [];
              for (let i = start; i < end; i++) {
                calls.push({ address: factory, abi: FACTORY_MIN_ABI, functionName: "allPairs" as const, args: [BigInt(i)]});
              }
              const res = await runMulticallOrSequential(calls);
              for (const r of res) if (r.status === "success") pairAddrs.push(getAddress(r.result as Address));
            }

            if (pairAddrs.length > 0) {
              const balCalls = pairAddrs.map(addr => ({ address: addr, abi: ERC20_ABI, functionName: "balanceOf" as const, args: [address] }));
              const balRes = await runMulticallOrSequential(balCalls);

              const owned: Address[] = [];
              const ownedBal: Record<string, bigint> = {};
              balRes.forEach((r, i) => {
                if (r.status === "success") {
                  const b = r.result as bigint;
                  if (b > 0n) { owned.push(getAddress(pairAddrs[i])); ownedBal[getAddress(pairAddrs[i])] = b; }
                }
              });

              if (owned.length > 0) {
                const calls = owned.flatMap(addr => ([
                  { address: addr, abi: PAIR_V2_ABI, functionName: "token0" as const },
                  { address: addr, abi: PAIR_V2_ABI, functionName: "token1" as const },
                  { address: addr, abi: PAIR_V2_ABI, functionName: "getReserves" as const },
                  { address: addr, abi: PAIR_V2_ABI, functionName: "totalSupply" as const },
                ]));
                const res = await runMulticallOrSequential(calls);

                type MetaPair = { lp: Address; t0: Address; t1: Address; r0: bigint; r1: bigint; ts: bigint; bal: bigint; };
                const metaPairs: MetaPair[] = [];
                for (let i = 0; i < owned.length; i++) {
                  const base = i * 4;
                  const ok = res[base].status === "success" && res[base+1].status === "success" && res[base+2].status === "success" && res[base+3].status === "success";
                  if (!ok) continue;
                  const t0 = res[base]!.result as Address;
                  const t1 = res[base+1]!.result as Address;
                  const rr = res[base+2]!.result as any;
                  const ts = res[base+3]!.result as bigint;
                  if (ts === 0n) continue;
                  metaPairs.push({ lp: getAddress(owned[i]), t0, t1, r0: rr[0] as bigint, r1: rr[1] as bigint, ts, bal: ownedBal[getAddress(owned[i])] });
                }

                if (metaPairs.length > 0) {
                  const metaCalls = metaPairs.flatMap(p => ([
                    { address: p.t0, abi: ERC20_ABI, functionName: "decimals" as const },
                    { address: p.t0, abi: ERC20_ABI, functionName: "symbol"   as const },
                    { address: p.t0, abi: ERC20_ABI, functionName: "name"     as const },
                    { address: p.t1, abi: ERC20_ABI, functionName: "decimals" as const },
                    { address: p.t1, abi: ERC20_ABI, functionName: "symbol"   as const },
                    { address: p.t1, abi: ERC20_ABI, functionName: "name"     as const },
                  ]));
                  const meta = await runMulticallOrSequential(metaCalls);

                  for (let i = 0; i < metaPairs.length; i++) {
                    const p = metaPairs[i];
                    const m = meta.slice(i*6, i*6 + 6);
                    const d0 = m[0].status === "success" ? Number(m[0].result as bigint) : 18;
                    const s0 = m[1].status === "success" ? String(m[1].result) : "T0";
                    const n0 = m[2].status === "success" ? String(m[2].result) : s0;
                    const d1 = m[3].status === "success" ? Number(m[3].result as bigint) : 18;
                    const s1 = m[4].status === "success" ? String(m[4].result) : "T1";
                    const n1 = m[5].status === "success" ? String(m[5].result) : s1;

                    const amt0 = (p.r0 * p.bal) / p.ts;
                    const amt1 = (p.r1 * p.bal) / p.ts;

                    nextPositions.push({
                      id: `${chainId}:${String(p.t0)}:${String(p.t1)}`,
                      chainId,
                      lpAddr: p.lp,
                      tokenA: { chainId, address: p.t0, symbol: s0, name: n0, logo: defaultLogo },
                      tokenB: { chainId, address: p.t1, symbol: s1, name: n1, logo: defaultLogo },
                      amountA: formatUnits(amt0, d0),
                      amountB: formatUnits(amt1, d1),
                      lpShares: formatUnits(p.bal, 18),
                      ts: Date.now(),
                    });
                  }
                }
              }
            }
          }

          if (nextPositions.length === 0) {
            setNote(usedApi
              ? "No LP detected from balances. Factory scan also found none."
              : "Liquidity balances unavailable"
            );
          }
        }

        nextPositions.sort((a, b) => (b.ts - a.ts));
        setPositions(nextPositions);
        const k = posKey(address, chainId);
        if (k) localStorage.setItem(k, JSON.stringify(nextPositions));

      } catch (e: any) {
        setNote(String(e?.message || e));
        try {
          const k = posKey(address, chainId);
          const arr: Position[] = k ? JSON.parse(localStorage.getItem(k) || "[]") : [];
          arr.sort((a, b) => (b.ts - a.ts));
          setPositions(arr);
        } catch { setPositions([]); }
      } finally {
        setLoading(false);
      }
    })();
  }, [isConnected, address, chainId, publicClient]);

  const filtered = useMemo(() => {
    let list = positions;
    if (onlyCurrentChain) list = list.filter(p => p.chainId === chainId);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p =>
        `${p.tokenA.symbol}-${p.tokenB.symbol}`.toLowerCase().includes(q) ||
        (p.tokenA.name || "").toLowerCase().includes(q) ||
        (p.tokenB.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [positions, query, onlyCurrentChain, chainId]);

  const managePos = useMemo(() => filtered.find(p => p.id === manageId) || null, [filtered, manageId]);

  useEffect(() => {
    if (manageId) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [manageId]);

  const preview = useMemo(() => {
    if (!managePos) return null;
    const part = rangePct / 100;
    const outA = Number(managePos.amountA || 0) * part;
    const outB = Number(managePos.amountB || 0) * part;
    const lp  = Number(managePos.lpShares || 0) * part;
    return { outA, outB, lp };
  }, [managePos, rangePct]);

  
  const routerAddr = ROUTER_BY_CHAIN[chainId];

  async function readDecimals(addr: Address) {
    try {
      const d = await publicClient!.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }) as bigint;
      return Number(d);
    } catch { return 18; }
  }

  async function refreshPositionFromChain(pos: Position): Promise<Position> {
    const [r, ts, bal, d0, d1, lpDec] = await Promise.all([
      publicClient!.readContract({ address: pos.lpAddr, abi: PAIR_V2_ABI, functionName: "getReserves" }) as Promise<any>,
      publicClient!.readContract({ address: pos.lpAddr, abi: PAIR_V2_ABI, functionName: "totalSupply" }) as Promise<bigint>,
      publicClient!.readContract({ address: pos.lpAddr, abi: ERC20_ABI, functionName: "balanceOf", args: [address!] }) as Promise<bigint>,
      readDecimals(pos.tokenA.address as Address),
      readDecimals(pos.tokenB.address as Address),
      readDecimals(pos.lpAddr),
    ]);
    const r0 = r[0] as bigint, r1 = r[1] as bigint;
    const amt0 = ts === 0n ? 0n : (r0 * bal) / ts;
    const amt1 = ts === 0n ? 0n : (r1 * bal) / ts;

    return {
      ...pos,
      amountA: formatUnits(amt0, d0),
      amountB: formatUnits(amt1, d1),
      lpShares: formatUnits(bal, lpDec),
      ts: Date.now(),
    };
  }

  async function onConfirmRemove() {
    if (!managePos || !address || !routerAddr || !walletClient || !publicClient) {
      setTxNote(!routerAddr ? "Router address missing for this chain. Fill ROUTER_BY_CHAIN to enable removal." : "Wallet/public client not ready.");
      return;
    }
    try {
      setTxBusy(true);
      setTxNote("Preparing…");

      const [decA, decB, decLP] = await Promise.all([
        readDecimals(managePos.tokenA.address as Address),
        readDecimals(managePos.tokenB.address as Address),
        readDecimals(managePos.lpAddr),
      ]);

      const part = rangePct / 100;
      const lpHuman = Number(managePos.lpShares || 0) * part;
      const liq = parseUnits(lpHuman.toString(), decLP);

      const aMin = parseUnits((Number(preview?.outA || 0) * 0.995).toString(), decA);
      const bMin = parseUnits((Number(preview?.outB || 0) * 0.995).toString(), decB);

      
      const allowance = await publicClient.readContract({
        address: managePos.lpAddr, abi: ERC20_ABI, functionName: "allowance", args: [address, routerAddr],
      }) as bigint;

      if (allowance < liq) {
        setTxNote("Approving LP to router…");
        const hashApprove = await walletClient.writeContract({
          address: managePos.lpAddr, abi: ERC20_ABI, functionName: "approve", args: [routerAddr, liq], account: address,
        });
        pushToast("info", "Approval submitted. Waiting for confirmation…");
        await publicClient.waitForTransactionReceipt({ hash: hashApprove });
        pushToast("success", "LP approved for the router.");
      }

     
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 15 * 60);
      setTxNote("Submitting removeLiquidity…");
      const hash = await walletClient.writeContract({
        address: routerAddr, abi: ROUTER_V2_MIN_ABI, functionName: "removeLiquidity",
        args: [managePos.tokenA.address as Address, managePos.tokenB.address as Address, liq, aMin, bMin, address, deadline],
        account: address,
      });
      setTxNote("Waiting for confirmation…");
      const rcpt = await publicClient.waitForTransactionReceipt({ hash });

      if (rcpt.status === "success") {
        pushToast("success", "Liquidity removed successfully.");
        const fresh = await refreshPositionFromChain(managePos);
        setPositions(prev => prev.map(p => p.id === managePos.id ? fresh : p));
        setTxNote("Removed successfully.");
      } else {
        pushToast("error", "Transaction reverted.");
        setTxNote("Transaction reverted.");
      }
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || String(e);
      pushToast("error", `Remove failed: ${msg}`);
      setTxNote(msg);
    } finally {
      setTxBusy(false);
      setTimeout(() => setManageId(null), 600);
    }
  }

  return (
    <div className="liq-wrap">
      
      <header className="liq-hero">
        <div className="crumbs"><b>Manage your pool</b></div>
        <h1>Manage Liquidity</h1>
        <p>Review your LPs, top up positions, or remove a portion safely.</p>
        <div className="hero-badges">
          <span className="badge green chain-badge">
            <TokenIcon src={CHAIN_META[chainId]?.logo || defaultLogo} alt={CHAIN_META[chainId]?.name || `Chain ${chainId}`} />
            <span>{CHAIN_META[chainId]?.name || `Chain ${chainId}`}</span>
          </span>
          {!isConnected && <span className="badge yellow">Connect wallet to load positions</span>}
          {MULTICALL3[chainId] === null && <span className="badge yellow">Add Multicall3 for this chain</span>}
          {usedFallbackSeq && <span className="badge yellow">Multicall unavailable → sequential fallback</span>}
          {!ROUTER_BY_CHAIN[chainId] && <span className="badge yellow">Set Router for this chain</span>}
        </div>
      </header>

    
      <section className="panel">
        <div className="ml-toolbar">
          <div className="search mini">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <input
              placeholder="Search your LP (By Name)"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
            />
          </div>
          <label className="ml-tog">
            <input type="checkbox" checked={onlyCurrentChain} onChange={(e)=>setOnlyCurrentChain(e.target.checked)} />
            <span>Current network only</span>
          </label>
        </div>

        {loading ? (
          <div className="grid-tiles">
            {Array.from({length:6}).map((_,i)=>(<div key={i} className="card glass lp-card skeleton" />))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card glass empty">
            <img className="empty-img" src={notFoundImg} alt="" />
            <div className="title">No positions found</div>
            <div className="sub">Try switching network, clear filter, or add liquidity first.</div>
            <a className="btn primary" href="/liquidity">Add Liquidity</a>
            {note && <div className="sub" style={{marginTop:8, opacity:.8}}>{note}</div>}
          </div>
        ) : (
          <div className="grid-tiles">
            {filtered.map((p)=>(
              <article key={p.id} className="card glass lp-card">
                <div className="pair">
                  <div className="icons">
                    <TokenIcon src={p.tokenA.logo || defaultLogo} alt={p.tokenA.symbol} />
                    <TokenIcon src={p.tokenB.logo || defaultLogo} alt={p.tokenB.symbol} />
                  </div>
                  <div className="meta">
                    <div className="sym">{p.tokenA.symbol}-{p.tokenB.symbol} <span className="lp">LP</span></div>
                    <div className="chain small">
                      <img src={CHAIN_META[p.chainId]?.logo || defaultLogo} alt="" />
                      <span>{CHAIN_META[p.chainId]?.name || `Chain ${p.chainId}`}</span>
                    </div>
                  </div>
                </div>

                <div className="rows">
                  <div className="row">
                    <div className="label">Your deposit</div>
                    <div className="val">{short(p.lpShares, 4)} LP</div>
                  </div>
                  <div className="row">
                    <div className="label">Last update</div>
                    <div className="val small">{new Date(p.ts).toLocaleString()}</div>
                  </div>
                </div>

                <div className="row-btns">
                  <button className="btn primary" onClick={() => { setManageId(p.id); setMode("choose"); setRangePct(25); setTxNote(null); }}>
                    Manage
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    
      {managePos && (
        <>
          <div className="modal-backdrop" onClick={()=>!txBusy && setManageId(null)} />
          <div className={"modal-card pancake " + (txBusy ? "disabled" : "")} role="dialog" aria-modal="true" aria-label="Manage Position">
            <div className="modal-header">
              <div className="modal-title">Manage Position</div>
              <button className="modal-x" onClick={()=>!txBusy && setManageId(null)} aria-label="Close">×</button>
            </div>

            <div className="mm-body">
              <div className="mm-pair">
                <TokenIcon src={managePos.tokenA.logo || defaultLogo} alt={managePos.tokenA.symbol} />
                <TokenIcon src={managePos.tokenB.logo || defaultLogo} alt={managePos.tokenB.symbol} />
                <div className="mm-sym">{managePos.tokenA.symbol}-{managePos.tokenB.symbol} <span className="lp">LP</span></div>
                <div className="chip" style={{marginLeft:"auto"}}>
                  <img src={CHAIN_META[managePos.chainId]?.logo || defaultLogo} alt="" />
                  <span>{CHAIN_META[managePos.chainId]?.name || `Chain ${managePos.chainId}`}</span>
                </div>
              </div>

              <div className="mm-grid wide">
                <div className="box">
                  <div className="box-label">Your position</div>
                  <div className="pos-rows">
                    <div><span>{short(managePos.amountA)} {managePos.tokenA.symbol}</span></div>
                    <div><span>{short(managePos.amountB)} {managePos.tokenB.symbol}</span></div>
                    <div className="muted"><span>{short(managePos.lpShares,4)} LP</span></div>
                  </div>
                </div>

                <div className="box box-remove">
                  {mode === "choose" ? (
                    <div className="choose-acts vertical">
                      <button className="btn primary" onClick={()=>navigate("/liquidity")}>Increase Liquidity</button>
                      <button className="btn ghost" onClick={()=>setMode("remove")}>Remove Liquidity</button>
                    </div>
                  ) : (
                    <>
                      <div className="box-label">Remove (preview)</div>
                      <div className="slider">
                        <input type="range" min={1} max={100} step={1} value={rangePct} onChange={(e)=>setRangePct(Number(e.target.value))} disabled={txBusy}/>
                        <div className="ticks">
                          {[25,50,75,100].map(v=>(
                            <button key={v} className={"tick " + (rangePct===v?"on":"")} onClick={()=>setRangePct(v)} disabled={txBusy}>{v}%</button>
                          ))}
                        </div>
                      </div>
                      <div className="preview">
                        <div className="line"><span>Receive {managePos.tokenA.symbol}</span><b>{short(preview?.outA || 0)}</b></div>
                        <div className="line"><span>Receive {managePos.tokenB.symbol}</span><b>{short(preview?.outB || 0)}</b></div>
                        <div className="line small"><span>LP burned</span><b>{short(preview?.lp || 0, 4)}</b></div>
                      </div>
                      <div className="md-actions">
                        <button className="btn primary bright" onClick={onConfirmRemove} disabled={txBusy || !routerAddr}>
                          {txBusy ? "Processing…" : "Confirm Remove"}
                        </button>
                      </div>
                      <div className="mm-info">{txNote ? txNote : <>Values update in real time as you move the slider.</>}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

   
          <div className="toast-wrap">
            {toasts.map(t=>(
              <div key={t.id} className={`toast ${t.kind}`}>
                <img src={t.kind === "error" ? failIcon : okIcon} alt="" />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
