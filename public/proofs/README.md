# Proof shards

`/proofs/<poolId>/<xx>.json` — one file per first address byte (`00`..`ff`, lowercase).
Only `mock/` lives in the repo (fake demo data for `/?demo=1`).
Do NOT commit real proof files here without owner sign-off; see `src/lib/proofs.ts` and `src/lib/airdrop.ts`.
