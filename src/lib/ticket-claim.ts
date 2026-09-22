import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SUPPLY } from "@/lib/drop";
import { formatTicket } from "@/lib/ticket";

const HandleInput = z.object({
  handle: z.string().min(1).max(16),
});

function normalizeClaimHandle(raw: string): string {
  const handle = raw.trim().replace(/^@+/, "");
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    throw new Error("Invalid handle");
  }
  return handle.toLowerCase();
}

function hasDatabaseUrl(): boolean {
  const raw = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
  return Boolean(raw && raw.trim());
}

export const getTicketCount = createServerFn({ method: "POST" }).handler(async () => {
  if (!hasDatabaseUrl()) {
    throw new Error("NO_DB");
  }
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from tickets`;
  return { issued: rows[0]?.n ?? 0 };
});

export const claimTicket = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const parsed = HandleInput.parse(input);
    return { handle: normalizeClaimHandle(parsed.handle) };
  })
  .handler(async ({ data }) => {
    if (!hasDatabaseUrl()) {
      throw new Error("NO_DB");
    }
    const { createHash } = await import("node:crypto");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const handleHash = createHash("sha256").update(data.handle).digest("hex");

    const inserted = await sql<{ id: number }>`
      insert into tickets (handle_hash)
      select ${handleHash}
      where (select count(*) from tickets) < ${SUPPLY}
      on conflict (handle_hash) do nothing
      returning id
    `;

    let id = inserted[0]?.id;
    if (!id) {
      const existing = await sql<{ id: number }>`
        select id from tickets where handle_hash = ${handleHash}
      `;
      id = existing[0]?.id;
    }
    if (!id) {
      throw new Error("Whitelist is full");
    }

    const counted = await sql<{ n: number }>`select count(*)::int as n from tickets`;
    return { ticket: formatTicket(id), issued: counted[0]?.n ?? id };
  });
