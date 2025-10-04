// src/lib/customTokens.ts
import type { Address } from "viem";
const LS_PREFIX = "airon.customTokens.v1"; 
const EVT = "airon:customTokensUpdated";

export type CustomToken = {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

type Store = Record<string, CustomToken[]>; 

const norm = (a: string) => a.toLowerCase();

function keyFor(account?: Address | null) {
  
  return account ? `${LS_PREFIX}:${norm(account as string)}` : `${LS_PREFIX}:__noacct__`;
}

function readStore(account?: Address | null): Store {
  try {
    const raw = localStorage.getItem(keyFor(account));
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(s: Store, account?: Address | null) {
  try {
    localStorage.setItem(keyFor(account), JSON.stringify(s));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

/** List custom tokens for a chain (account-scoped) */
export function listCustomTokens(chainId: number, account?: Address | null): CustomToken[] {
  const s = readStore(account);
  return (s[String(chainId)] || []).slice();
}

/** Add or replace a custom token (account-scoped) */
export function upsertCustomToken(tok: CustomToken, account?: Address | null) {
  const s = readStore(account);
  const key = String(tok.chainId);
  const arr = s[key] || [];
  const lc = norm(tok.address as string);
  const i = arr.findIndex((t) => norm(t.address as string) === lc);
  const next: CustomToken = {
    ...tok,
    address: tok.address as Address,
    logoURI: tok.logoURI || "",
  };
  if (i >= 0) arr[i] = next;
  else arr.push(next);
  s[key] = arr;
  writeStore(s, account);
}

/** Remove a custom token (account-scoped) */
export function removeCustomToken(chainId: number, address: Address, account?: Address | null) {
  const s = readStore(account);
  const key = String(chainId);
  const arr = s[key] || [];
  const lc = norm(address as string);
  s[key] = arr.filter((t) => norm(t.address as string) !== lc);
  writeStore(s, account);
}

/** Subscribe to updates (fires after upsert/remove). Returns unsubscribe. */
export function onCustomTokensUpdated(cb: () => void) {
  const h = () => cb();
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
