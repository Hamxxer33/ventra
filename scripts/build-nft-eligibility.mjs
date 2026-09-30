#!/usr/bin/env node
/**
 * Rebuild public/eligibility/nft-holders.json from the final NFT holders CSV.
 * Usage: node scripts/build-nft-eligibility.mjs [path-to-csv]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath =
  process.argv[2] ||
  resolve(root, "../listings/nft-holders/ventran-nft-holders-final.csv");
const outPath = resolve(root, "public/eligibility/nft-holders.json");

const lines = readFileSync(csvPath, "utf8").trim().split("\n").slice(1);
const map = {};
for (const line of lines) {
  const [address, balance] = line.split(",");
  if (!address) continue;
  map[address.toLowerCase()] = { owner: address, tokenCount: Number(balance) };
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(map));
console.log(`Wrote ${Object.keys(map).length} entries → ${outPath}`);
