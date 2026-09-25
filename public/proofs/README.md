# Proof files

Real proofs (~558 MB for the community pool) are NOT stored in this repo. They are hosted
externally (CDN / Vercel Blob) and the claim page reads them from `VITE_PROOFS_BASE_URL`:

    <VITE_PROOFS_BASE_URL>/<pool>/meta.json
    <VITE_PROOFS_BASE_URL>/<pool>/<xx>.json   # xx = lowercase address.slice(2, 4)

Only `mock/` lives here: a 2-leaf tree of fake addresses, used by `/?demo=1`.
See `src/lib/proofs.ts` and `src/lib/airdrop.ts`.
