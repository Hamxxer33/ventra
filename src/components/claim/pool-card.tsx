import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  MERKLE_DISTRIBUTOR_ABI,
  VENT,
  formatCompactTokens,
  formatVent,
  isPoolClaimable,
  isUserRejection,
  type AirdropPool,
} from "@/lib/airdrop";
import { loadProof } from "@/lib/proofs";
import { TARGET_CHAIN } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { useMounted } from "@/components/claim/use-mounted";

function StatusPill({ pool }: { pool: AirdropPool }) {
  const open = isPoolClaimable(pool);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center border-2 px-2 py-1 font-display text-micro uppercase leading-none",
        open ? "border-accent bg-accent text-fg" : "border-border bg-bg text-muted",
      )}
    >
      {open ? "Claims open" : pool.statusLabel}
    </span>
  );
}

export function PoolCard({ pool }: { pool: AirdropPool }) {
  const mounted = useMounted();
  const { address, isConnected, chainId } = useConnection();
  const addressLower = address?.toLowerCase();
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const claimable = isPoolClaimable(pool);

  const proofQuery = useQuery({
    queryKey: ["vent-proof", pool.id, addressLower],
    queryFn: ({ signal }) => loadProof(pool.id, addressLower!, { signal }),
    enabled: mounted && Boolean(addressLower) && pool.proofsPublished,
    staleTime: 5 * 60_000,
  });
  const entry = proofQuery.data?.eligible ? proofQuery.data.entry : null;

  // On-chain "already claimed" check — only runs once a contract is configured.
  const claimedQuery = useReadContract({
    address: pool.contract ?? undefined,
    abi: MERKLE_DISTRIBUTOR_ABI,
    functionName: "isClaimed",
    args: entry ? [BigInt(entry.index)] : undefined,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(pool.contract && entry) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(write.data) },
  });
  const switchChain = useSwitchChain();

  const claimed = claimedQuery.data === true || receipt.data?.status === "success";

  function onClaim() {
    // Guarded: never reachable while `pool.contract` is null (button is disabled).
    if (!pool.contract || !entry || !address) return;
    // TODO(contract): verify the deployed distributor matches MERKLE_DISTRIBUTOR_ABI
    // (claim(index, account, amount, proof)) and that `pool.merkleRoot` equals its on-chain root.
    // The connected wallet signs and pays its own gas on Arbitrum One.
    write.mutate({
      address: pool.contract,
      abi: MERKLE_DISTRIBUTOR_ABI,
      functionName: "claim",
      args: [BigInt(entry.index), address, entry.amount, entry.proof],
      chainId: TARGET_CHAIN.id,
    });
  }

  let yourStatus: React.ReactNode;
  if (!mounted) {
    yourStatus = <p className="font-sans text-lg text-muted">…</p>;
  } else if (!isConnected) {
    yourStatus = (
      <p className="font-sans text-lg text-muted">Connect a wallet to check eligibility.</p>
    );
  } else if (!pool.proofsPublished) {
    yourStatus = (
      <p className="font-sans text-lg text-muted">
        {pool.status === "snapshot-pending"
          ? "Snapshot not taken yet. Holders are checked after the NFT mint closes."
          : "Eligibility list not published yet. Check back when claims open."}
      </p>
    );
  } else if (proofQuery.isPending) {
    yourStatus = (
      <p className="flex items-center gap-2 font-sans text-lg text-muted">
        <Loader2 className="size-4 animate-spin" /> Checking eligibility…
      </p>
    );
  } else if (proofQuery.isError) {
    yourStatus = (
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-sans text-lg text-danger">Couldn&apos;t load eligibility.</p>
        <Button variant="ghost" onClick={() => void proofQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  } else if (!entry) {
    yourStatus = (
      <p className="font-sans text-lg text-fg">This wallet is not eligible for {pool.shortName}.</p>
    );
  } else {
    yourStatus = (
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-accent sm:text-pixel">
          {claimed ? "Claimed" : "Eligible"}
        </p>
        <p className="font-display text-pixel-lg text-fg sm:text-pixel-xl">
          {formatVent(entry.amount)} <span className="text-accent">VENT</span>
        </p>
        {pool.eligibleNote ? (
          <p className="font-sans text-base text-muted">{pool.eligibleNote}</p>
        ) : null}
        {claimed ? (
          <p className="flex items-center gap-2 font-sans text-lg text-fg">
            <CheckCircle2 className="size-4 text-accent" /> Already claimed to this wallet.
          </p>
        ) : !claimable ? (
          <p className="font-sans text-lg text-muted">{pool.statusLabel}. Nothing to do yet.</p>
        ) : null}
      </div>
    );
  }

  let button: React.ReactNode;
  if (claimed) {
    button = <Button disabled>Claimed</Button>;
  } else if (!claimable) {
    button = <Button disabled>{pool.statusLabel}</Button>;
  } else if (!isConnected) {
    button = <Button disabled>Connect wallet first</Button>;
  } else if (wrongNetwork) {
    button = (
      <Button
        disabled={switchChain.isPending}
        onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
      >
        Switch to {VENT.chainName}
      </Button>
    );
  } else if (!entry) {
    button = <Button disabled>Not eligible</Button>;
  } else if (write.isPending) {
    button = <Button disabled>Confirm in wallet…</Button>;
  } else if (receipt.isLoading) {
    button = <Button disabled>Claiming…</Button>;
  } else {
    button = <Button onClick={onClaim}>Claim {formatVent(entry.amount)} VENT</Button>;
  }

  return (
    <article
      className={cn(
        "flex flex-col gap-5 border-2 bg-surface p-5 shadow-pixel sm:p-6",
        pool.mock ? "border-dashed border-muted" : "border-accent",
      )}
    >
      <header className="flex flex-col gap-3">
        <StatusPill pool={pool} />
        <h3 className="font-display text-pixel text-fg sm:text-pixel-lg">{pool.name}</h3>
      </header>

      {pool.totalTokens > 0 ? (
        <p className="font-display text-pixel-xl text-fg sm:text-pixel-2xl">
          {formatCompactTokens(pool.totalTokens)} <span className="text-accent">VENT</span>
        </p>
      ) : null}
      <p className="font-sans text-lg leading-snug text-muted">{pool.description}</p>

      <dl className="grid gap-2 font-sans text-base">
        <div className="flex flex-col">
          <dt className="font-display text-micro uppercase text-muted">Allocation source</dt>
          <dd className="text-fg">{pool.allocationSource}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="font-display text-micro uppercase text-muted">Snapshot block</dt>
          <dd className="text-fg">
            {pool.snapshotBlock !== null
              ? pool.snapshotBlock.toLocaleString("en-US")
              : "To be announced"}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="font-display text-micro uppercase text-muted">Claim contract</dt>
          <dd className="break-all text-fg">
            {pool.contract ? (
              <a
                href={VENT.explorerAddressUrl(pool.contract)}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4"
              >
                {pool.contract}
              </a>
            ) : (
              "Not deployed yet"
            )}
          </dd>
        </div>
      </dl>

      <div className="border-2 border-border bg-bg p-4">
        <p className="mb-2 font-display text-micro uppercase text-muted">Your wallet</p>
        {yourStatus}
      </div>

      <div className="flex flex-col gap-2">
        {button}
        {write.error ? (
          <p className="font-sans text-base text-danger">
            {isUserRejection(write.error)
              ? "Transaction rejected in wallet."
              : "Claim failed. You may already have claimed, or need a little ETH for gas."}
          </p>
        ) : null}
        {write.data ? (
          <a
            href={VENT.explorerTxUrl(write.data)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-sans text-base text-accent underline underline-offset-4"
          >
            View transaction <ExternalLink className="size-4" />
          </a>
        ) : null}
        <p className="font-sans text-base text-muted">
          Claiming is a normal transaction: your wallet pays its own gas (a little ETH on{" "}
          {VENT.chainName}).
        </p>
      </div>
    </article>
  );
}
