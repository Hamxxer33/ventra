import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  useConnection,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  VENT,
  VENT_AIRDROP_ABI,
  formatCompactTokens,
  formatOpensAt,
  formatVentExact,
  isPoolClaimable,
  isUserRejection,
  poolProofsBase,
  poolProofsReady,
  type AirdropPool,
} from "@/lib/airdrop";
import { ProofDataError, loadPoolMeta, loadProof } from "@/lib/proofs";
import { TARGET_CHAIN } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { ClaimCountdown } from "@/components/claim/claim-countdown";
import { useMounted } from "@/components/claim/use-mounted";
import { useNow } from "@/components/claim/use-now";
import { ClaimForPanel } from "@/components/claim/claim-for-panel";
import { SafetyLine } from "@/components/claim/safety-line";

const text = {
  muted: "font-sans text-lg text-muted",
  fg: "font-sans text-lg text-fg",
  danger: "font-sans text-lg text-danger",
};

export function PoolCard({ pool }: { pool: AirdropPool }) {
  const mounted = useMounted();
  const now = useNow();
  const { address, isConnected, chainId } = useConnection();
  const addressLower = address?.toLowerCase();
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const base = poolProofsBase(pool);
  const proofsReady = poolProofsReady(pool);

  // 1) Pool meta.json (token + root sanity), only once proofs are hosted.
  const metaQuery = useQuery({
    queryKey: ["vent-meta", pool.id, base],
    queryFn: ({ signal }) => loadPoolMeta(base!, pool.id, signal),
    enabled: mounted && proofsReady,
    staleTime: 10 * 60_000,
    retry: (count, err) => !(err instanceof ProofDataError) && count < 1,
  });
  const meta = metaQuery.data;

  // 2) The connected wallet's shard only.
  const proofQuery = useQuery({
    queryKey: ["vent-proof", pool.id, base, addressLower, meta?.root],
    queryFn: ({ signal }) => loadProof(base!, pool.id, addressLower!, meta!, signal),
    enabled: mounted && Boolean(addressLower && meta),
    staleTime: 10 * 60_000,
    retry: (count, err) => !(err instanceof ProofDataError) && count < 1,
  });
  const entry = proofQuery.data?.eligible ? proofQuery.data.entry : null;

  // 3) On-chain checks: only when a contract is configured.
  const contract = pool.contract ?? undefined;
  const chainInfo = useReadContracts({
    contracts: [
      { address: contract, abi: VENT_AIRDROP_ABI, functionName: "token", chainId: TARGET_CHAIN.id },
      {
        address: contract,
        abi: VENT_AIRDROP_ABI,
        functionName: "merkleRoot",
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract,
        abi: VENT_AIRDROP_ABI,
        functionName: "claimStart",
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract,
        abi: VENT_AIRDROP_ABI,
        functionName: "claimEnd",
        chainId: TARGET_CHAIN.id,
      },
    ],
    query: { enabled: Boolean(contract) },
  });
  const [tokenRes, rootRes, startRes, endRes] = chainInfo.data ?? [];
  const onchainToken = tokenRes?.result as string | undefined;
  const onchainRoot = rootRes?.result as string | undefined;
  const claimStartMs = startRes?.result !== undefined ? Number(startRes.result) * 1000 : null;
  const claimEndMs = endRes?.result !== undefined ? Number(endRes.result) * 1000 : null;

  const contractMismatch =
    (onchainToken && onchainToken.toLowerCase() !== VENT.address.toLowerCase()
      ? `Contract token ${onchainToken} is not VENT.`
      : null) ??
    (onchainRoot && meta && onchainRoot.toLowerCase() !== meta.root.toLowerCase()
      ? "Contract Merkle root does not match the published proofs."
      : null);

  const isClaimedQuery = useReadContract({
    address: contract,
    abi: VENT_AIRDROP_ABI,
    functionName: "isClaimed",
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(contract && address) },
  });

  const windowOpen =
    now !== null &&
    (claimStartMs === null || now >= claimStartMs) &&
    (claimEndMs === null || now <= claimEndMs);
  const claimable = now !== null && isPoolClaimable(pool, now) && windowOpen && !contractMismatch;

  const canClaimQuery = useReadContract({
    address: contract,
    abi: VENT_AIRDROP_ABI,
    functionName: "canClaim",
    args: address && entry ? [address, entry.amount, entry.proof] : undefined,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(contract && address && entry && claimable) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(write.data) },
  });
  const switchChain = useSwitchChain();

  const refetchClaimed = isClaimedQuery.refetch;
  useEffect(() => {
    if (receipt.data?.status === "success") void refetchClaimed();
  }, [receipt.data?.status, refetchClaimed]);

  const claimed = isClaimedQuery.data === true || receipt.data?.status === "success";
  const proofRejected = claimable && !claimed && canClaimQuery.data === false;

  function onClaim() {
    // Guarded: unreachable while `pool.contract` is null (button disabled).
    if (!pool.contract || !entry || !address || !claimable) return;
    // VentAirdrop.claim(uint256 amount, bytes32[] proof): msg.sender claims for itself and
    // pays its own gas. `entry.index` is not part of the call.
    write.mutate({
      address: pool.contract,
      abi: VENT_AIRDROP_ABI,
      functionName: "claim",
      args: [entry.amount, entry.proof],
      chainId: TARGET_CHAIN.id,
    });
  }

  const dataError =
    (metaQuery.error instanceof ProofDataError && metaQuery.error.message) ||
    (proofQuery.error instanceof ProofDataError && proofQuery.error.message) ||
    contractMismatch;

  let yourStatus: React.ReactNode;
  if (!mounted) {
    yourStatus = <p className={text.muted}>…</p>;
  } else if (dataError) {
    yourStatus = (
      <p className={cn(text.danger, "flex items-start gap-2")}>
        <AlertTriangle className="mt-1 size-4 shrink-0" /> {dataError}
      </p>
    );
  } else if (!isConnected) {
    yourStatus = <p className={text.muted}>Connect a wallet to check eligibility.</p>;
  } else if (!proofsReady) {
    yourStatus = (
      <p className={text.muted}>
        {pool.status === "snapshot-pending"
          ? "Snapshot not taken yet. Holders are checked after the NFT mint closes."
          : "Eligibility list not published yet. Check back when claims open."}
      </p>
    );
  } else if (metaQuery.isPending || proofQuery.isPending) {
    yourStatus = (
      <p className={cn(text.muted, "flex items-center gap-2")}>
        <Loader2 className="size-4 animate-spin" /> Checking eligibility…
      </p>
    );
  } else if (metaQuery.isError || proofQuery.isError) {
    yourStatus = (
      <div className="flex flex-wrap items-center gap-3">
        <p className={text.danger}>Couldn&apos;t load eligibility.</p>
        <Button
          variant="ghost"
          onClick={() => void (metaQuery.isError ? metaQuery.refetch() : proofQuery.refetch())}
        >
          Retry
        </Button>
      </div>
    );
  } else if (!entry) {
    yourStatus = <p className={text.fg}>This wallet is not eligible for {pool.shortName}.</p>;
  } else {
    yourStatus = (
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-accent sm:text-pixel">
          {claimed ? "Claimed" : "Eligible"}
        </p>
        <p className="break-all font-display text-pixel-lg text-fg sm:text-pixel-xl">
          {formatVentExact(entry.amount)} <span className="text-accent">VENT</span>
        </p>
        {pool.eligibleNote ? (
          <p className="font-sans text-base text-muted">{pool.eligibleNote}</p>
        ) : null}
        {claimed ? (
          <p className={cn(text.fg, "flex items-center gap-2")}>
            <CheckCircle2 className="size-4 text-accent" /> Already claimed to this wallet.
          </p>
        ) : proofRejected ? (
          <p className={text.danger}>The contract rejected this proof. Do not retry; ask in TG.</p>
        ) : !claimable ? (
          <p className={text.muted}>{pool.statusLabel}. Nothing to do yet.</p>
        ) : null}
      </div>
    );
  }

  let button: React.ReactNode;
  if (claimed) button = <Button disabled>Claimed</Button>;
  else if (!claimable) button = <Button disabled>{pool.statusLabel}</Button>;
  else if (!isConnected) button = <Button disabled>Connect wallet first</Button>;
  else if (wrongNetwork)
    button = (
      <Button
        disabled={switchChain.isPending}
        onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
      >
        Switch to {VENT.chainName}
      </Button>
    );
  else if (!entry) button = <Button disabled>Not eligible</Button>;
  else if (proofRejected || canClaimQuery.isPending)
    button = <Button disabled>{proofRejected ? "Cannot claim" : "Checking…"}</Button>;
  else if (write.isPending) button = <Button disabled>Confirm in wallet…</Button>;
  else if (receipt.isLoading) button = <Button disabled>Claiming…</Button>;
  else button = <Button onClick={onClaim}>Claim {formatVentExact(entry.amount)} VENT</Button>;

  const showCountdown = pool.opensAt !== null && (now === null || now < pool.opensAt);

  return (
    <article
      className={cn(
        "flex flex-col gap-5 border-2 bg-surface p-5 shadow-pixel sm:p-6",
        pool.mock ? "border-dashed border-muted" : "border-accent",
      )}
    >
      <header className="flex flex-col gap-3">
        <span
          className={cn(
            "inline-flex w-fit items-center border-2 px-2 py-1 font-display text-micro uppercase leading-none",
            claimable ? "border-accent bg-accent text-fg" : "border-border bg-bg text-muted",
          )}
        >
          {claimable ? "Claims open" : pool.statusLabel}
        </span>
        <h3 className="font-display text-pixel text-fg sm:text-pixel-lg">{pool.name}</h3>
      </header>

      {pool.totalTokens > 0 ? (
        <p className="font-display text-pixel-xl text-fg sm:text-pixel-2xl">
          {formatCompactTokens(pool.totalTokens)} <span className="text-accent">VENT</span>
        </p>
      ) : null}
      <p className="font-sans text-lg leading-snug text-muted">{pool.description}</p>

      {showCountdown && pool.opensAt !== null ? (
        <div className="flex flex-col gap-2">
          <p className="font-display text-micro uppercase text-muted">
            Claims open {formatOpensAt(pool.opensAt)}
          </p>
          <ClaimCountdown target={pool.opensAt} now={now} />
        </div>
      ) : pool.status === "snapshot-pending" ? (
        <p className="font-display text-micro uppercase leading-relaxed text-muted">
          Opens after the NFT mint snapshot · no date yet
        </p>
      ) : null}

      <dl className="grid gap-2 font-sans text-base">
        <div className="flex flex-col">
          <dt className="font-display text-micro uppercase text-muted">Allocation source</dt>
          <dd className="text-fg">{pool.allocationSource}</dd>
        </div>
        {pool.snapshotBlock ? (
          <div className="flex flex-col">
            <dt className="font-display text-micro uppercase text-muted">Snapshot block</dt>
            <dd className="text-fg">{pool.snapshotBlock.toLocaleString("en-US")}</dd>
          </div>
        ) : null}
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
        <SafetyLine />
      </div>

      <ClaimForPanel
        pool={pool}
        meta={meta}
        metaPending={proofsReady && metaQuery.isPending}
        metaFailed={metaQuery.isError && !(metaQuery.error instanceof ProofDataError)}
        onRetryMeta={() => void metaQuery.refetch()}
        claimable={claimable}
        safetyError={
          (metaQuery.error instanceof ProofDataError && metaQuery.error.message) ||
          contractMismatch ||
          null
        }
      />
    </article>
  );
}
