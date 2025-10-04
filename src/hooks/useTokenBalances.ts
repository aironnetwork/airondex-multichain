import { useEffect, useMemo, useState } from "react";
import { erc20Abi } from "viem";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

type Item = { address: Address | "native"; decimals: number };
type BalMap = Record<string, { raw: bigint; formatted: string }>;

const fmtNum = (v: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(v);

export function useTokenBalances(
  chainId: number,
  account?: Address,
  items: Item[] = []
) {
  const pc = usePublicClient({ chainId });
  const [map, setMap] = useState<BalMap>({});


  const uniq = useMemo(() => {
    const seen = new Set<string>();
    const out: Item[] = [];
    for (const it of items) {
      const k = (it.address === "native" ? "native" : (it.address as string).toLowerCase());
      if (!seen.has(k)) { seen.add(k); out.push(it); }
    }
    return out;
  }, [items]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!pc || !account || uniq.length === 0) { if (alive) setMap({}); return; }

        const res: BalMap = {};

       
        const hasNative = uniq.some(i => i.address === "native");
        if (hasNative) {
          const raw = await pc.getBalance({ address: account });
          const dec = uniq.find(i => i.address === "native")?.decimals ?? 18;
          const num = Number(raw) / 10 ** dec;
          res["native"] = { raw, formatted: fmtNum(num) };
        }

       
        const erc = uniq.filter(i => i.address !== "native") as Item[];
        const chunk = 100;
        for (let i=0; i<erc.length; i+=chunk) {
          const slice = erc.slice(i, i+chunk);
          const calls = slice.map(i => ({
            address: i.address as Address,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [account],
          }));
          const r = await pc.multicall({ contracts: calls });
          r.forEach((entry, idx) => {
            const it = slice[idx];
            const raw = (entry.status === "success" ? (entry.result as bigint) : 0n);
            const num = Number(raw) / 10 ** (it.decimals ?? 18);
            res[(it.address as string).toLowerCase()] = { raw, formatted: fmtNum(num) };
          });
        }

        if (alive) setMap(res);
      } catch {
        if (alive) setMap({});
      }
    })();
    return () => { alive = false; };
  }, [pc, account, chainId, uniq]);

  const get = (addr: Address | "native") => {
    const k = addr === "native" ? "native" : (addr as string).toLowerCase();
    return map[k];
  };

  return { get };
}
