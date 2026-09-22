import { formatTicket } from "@/lib/ticket";

const ABACUS = "https://abacus.jasoncameron.dev";
const NS = "ventran-wl";
const KEY = "tickets";

export type IssuedTicket = {
  ticket: string;
  issued: number;
};

function stableFallback(handle: string): number {
  let hash = 2166136261;
  for (const ch of handle.toLowerCase()) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 90000 + 1;
}

async function readAbacusJson(path: string): Promise<{ value?: number } | null> {
  try {
    const res = await fetch(`${ABACUS}${path}`, {
      cache: "no-store",
      mode: "cors",
      credentials: "omit",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { value?: number };
    return data;
  } catch {
    return null;
  }
}

export async function readIssuedCount(): Promise<number> {
  const data = await readAbacusJson(`/get/${NS}/${KEY}`);
  return typeof data?.value === "number" && data.value >= 0 ? data.value : 0;
}

export async function claimFromAbacus(): Promise<IssuedTicket | null> {
  const data = await readAbacusJson(`/hit/${NS}/${KEY}`);
  if (typeof data?.value !== "number" || data.value < 1) return null;
  return { ticket: formatTicket(data.value), issued: data.value };
}

export function fallbackTicket(handle: string): IssuedTicket {
  const n = stableFallback(handle);
  return { ticket: formatTicket(n), issued: n };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function issueTicket(
  handle: string,
  fromServer: () => Promise<IssuedTicket>,
): Promise<IssuedTicket> {
  try {
    return await withTimeout(fromServer(), 4000);
  } catch {
    /* live site has no Postgres — use the public counter */
  }
  const remote = await claimFromAbacus();
  if (remote) return remote;
  return fallbackTicket(handle);
}
