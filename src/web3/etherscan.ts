// src/web3/etherscan.ts


export type EtherscanToken = {
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  tokenImage?: string;
  balance: string;
};

type V2Resp = {
  status: string;     
  message: string;   
  result?: unknown;   
  total?: number;     
  page?: number;
  offset?: number;
};

const V2_BASE = "https://api.etherscan.io/v2/api";


const API_KEYS: Record<number, string | undefined> = {
  1:  import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  56: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  42161: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  8453: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  97: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  11155111: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  84532: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  421614: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
  2030: import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined,
};

function buildUrl(p: {
  chainId: number;
  address: `0x${string}`;
  page: number;
  offset: number;
  apikey?: string;
}) {
  const u = new URL(V2_BASE);
  u.searchParams.set("module", "account");
  u.searchParams.set("action", "addresstokenbalance");
  u.searchParams.set("address", p.address);
  u.searchParams.set("page", String(p.page));
  u.searchParams.set("offset", String(p.offset));
  u.searchParams.set("chainid", String(p.chainId));
  if (p.apikey) u.searchParams.set("apikey", p.apikey);
  return u;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchAllV2Balances(params: {
  chainId: number;
  address: `0x${string}`;
  signal?: AbortSignal;
  perPage?: number;          
  interPageDelayMs?: number; 
  maxPages?: number;         
}): Promise<{ tokens: EtherscanToken[]; debug: string[] }> {
  const {
    chainId, address, signal,
    perPage = 200,
    interPageDelayMs = 400,
    maxPages = 50,
  } = params;

  const apikey = API_KEYS[chainId];
  const debug: string[] = [];
  const all: EtherscanToken[] = [];
  let page = 1;
  let totalKnown: number | undefined;

  while (page <= maxPages) {
    const url = buildUrl({ chainId, address, page, offset: perPage, apikey });
    debug.push(`[v2] GET ${url.toString()}`);

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal,
      });
    } catch (e: any) {
      debug.push(`[v2] fetch error: ${String(e?.message || e)}`);
      break;
    }

    if (!res.ok) {
      debug.push(`[v2] HTTP ${res.status}`);
      break;
    }

    let json: V2Resp;
    try {
      json = (await res.json()) as V2Resp;
    } catch {
      debug.push("[v2] JSON parse error");
      break;
    }

    const arr = Array.isArray(json.result) ? (json.result as EtherscanToken[]) : [];
    debug.push(`[v2] status=${json.status} msg=${json.message} len=${arr.length}`);

    if (json.status !== "1") {
      
      break;
    }

    all.push(...arr);
    if (typeof json.total === "number") totalKnown = json.total;

    if (arr.length < perPage) {
      debug.push("[v2] last page reached");
      break;
    }
    if (totalKnown && all.length >= totalKnown) {
      debug.push(`[v2] reached total=${totalKnown}`);
      break;
    }

    page += 1;
    await sleep(interPageDelayMs);
  }

 
  const dedup = Object.values(
    all.reduce<Record<string, EtherscanToken>>((acc, t) => {
      const k = t.tokenAddress.toLowerCase();
      if (!acc[k]) acc[k] = t;
      return acc;
    }, {})
  );

  return { tokens: dedup, debug };
}
