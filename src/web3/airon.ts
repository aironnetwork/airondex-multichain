// src/web3/pancake.ts

export type PancakeHolding = {
  id?: string;
  chainId?: number;
  timestamp?: string;
  value?: string;        
  quantity?: string;     
  token?: {
    decimals?: number;
    address?: string;
    name?: string;
    symbol?: string;
    logoURI?: string;
    isSpam?: boolean;
  };
  price?: {
    totalUsd?: number;
    usd?: number;
  } | null;
};

export type PancakeToken = {
  chainId: number | undefined;
  address: string;    
  symbol?: string;
  name?: string;
  decimals?: number;
  balance: string;    
  balanceUsd?: number;
  logoURI?: string;
  isSpam?: boolean;
};

export type PancakeFetchResult = {
  tokens: PancakeToken[];
  debug: string[];
};

const BASE =
  (import.meta as any).env?.VITE_PCS_WALLET_API_BASE?.replace(/\/+$/, "") ||
  "https://wallet-api.pancakeswap.com";

function isZeroAddress(a?: string) {
  return typeof a === "string" && /^0x0{40}$/i.test(a);
}

export async function fetchPancakeBalances(params: {
  address: string;
  signal?: AbortSignal;
}): Promise<PancakeFetchResult> {
  const dbg: string[] = [];
  const addr = params.address;
  const url = `${BASE}/v1/balances/${addr}`;

  dbg.push(`GET ${url}`);

  const res = await fetch(url, {
    method: "GET",
    signal: params.signal,
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    dbg.push(`HTTP ${res.status} ${res.statusText}: ${txt.slice(0, 200)}`);
    throw new Error(`Pancake API error: ${res.status}`);
  }

  const json = await res.json().catch(() => ({}));
  const keys = json && typeof json === "object" ? Object.keys(json) : [];
  dbg.push(`top-level type: ${Array.isArray(json) ? "array" : "object"} keys=${keys.join(",")}`);

  let holdings: PancakeHolding[] = [];

 
  if (Array.isArray(json)) {
    holdings = json as PancakeHolding[];
  } else {
    
    const maybeTokens = (json?.data?.tokens ?? json?.tokens) as any;
    if (Array.isArray(maybeTokens)) {
      
      holdings = (maybeTokens as any[]).map((t) => ({
        chainId: t.chainId,
        value: t.balance,
        token: {
          decimals: t.decimals,
          address: t.address,
          name: t.name,
          symbol: t.symbol,
          logoURI: t.logoURI,
          isSpam: t.isSpam,
        },
        price: t.price
          ? { totalUsd: t.price?.totalUsd, usd: t.price?.usd }
          : null,
      }));
    }
  }

  dbg.push(`holdings parsed: ${holdings.length}`);


  const tokens: PancakeToken[] = holdings
    .filter((h) => h?.token && h.token.address)
    .filter((h) => !isZeroAddress(h.token?.address)) 
    .map((h) => {
      const chainId =
        typeof h.chainId === "number" && Number.isFinite(h.chainId)
          ? h.chainId
          : undefined;

      
      const balance =
        typeof h.value === "string" && h.value.length > 0
          ? h.value
          : "0";

      return {
        chainId,
        address: String(h.token?.address || ""),
        symbol: h.token?.symbol,
        name: h.token?.name,
        decimals:
          typeof h.token?.decimals === "number" &&
          Number.isFinite(h.token.decimals)
            ? h.token.decimals
            : undefined,
        balance,
        balanceUsd:
          typeof h.price?.totalUsd === "number" &&
          Number.isFinite(h.price.totalUsd)
            ? h.price.totalUsd
            : undefined,
        logoURI: h.token?.logoURI,
        isSpam: !!h.token?.isSpam,
      } as PancakeToken;
    });

  return { tokens, debug: dbg };
}
