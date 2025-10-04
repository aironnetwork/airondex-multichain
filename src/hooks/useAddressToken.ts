import { useEffect, useState } from "react";
import type { Address } from "viem";
import { erc20Abi, isAddress, getAddress } from "viem";
import defaultLogo from "../assets/token/default.png";
import { usePublicClient } from "wagmi";
import { TRUSTWALLET_FOLDER } from "../config/tokenlists";

function trustWalletLogo(chainId: number, address: string) {
  const folder = TRUSTWALLET_FOLDER[chainId];
  return folder
    ? `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${folder}/assets/${address}/logo.png`
    : defaultLogo;
}

export function useAddressToken(chainId: number, q: string) {
  const pc = usePublicClient({ chainId });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<null | {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
    logoResolved?: string;
  }>(null);

  const s = q.trim();
  const isAddressQuery = isAddress(s);

  useEffect(() => {
    let cancelled = false;
    if (!pc || !isAddressQuery) { setToken(null); setLoading(false); return; }

    const addr = getAddress(s);
    (async () => {
      try {
        setLoading(true);
        const [symbol, name, decimals] = await Promise.all([
          pc.readContract({ address: addr, abi: erc20Abi, functionName: "symbol" }) as Promise<string>,
          pc.readContract({ address: addr, abi: erc20Abi, functionName: "name" }) as Promise<string>,
          pc.readContract({ address: addr, abi: erc20Abi, functionName: "decimals" }) as Promise<number>,
        ]);
        if (cancelled) return;
        setToken({
          address: addr,
          symbol,
          name,
          decimals,
          logoResolved: trustWalletLogo(chainId, addr) || defaultLogo,
        });
      } catch {
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pc, isAddressQuery, s, chainId]);

  return { loading, token, isAddressQuery };
}
