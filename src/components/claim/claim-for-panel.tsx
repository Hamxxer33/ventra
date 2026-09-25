import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  useConnection,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEMO_CLAIMED_ADDRESS,
  DEMO_LISTED_ADDRESS,
  VENT,
  VENT_AIRDROP_ABI,
  formatVentExact,
  isUserRejection,
  parseListedAddress,
  poolProofsBase,
  poolProofsReady,
  shortAddress,
  type AirdropPool,
} from "@/lib/airdrop";
import { ProofDataError, loadProof, type PoolMeta } from "@/lib/proofs";
import { TARGET_CHAIN } from "@/lib/wagmi";
import { cn } from "@/lib/utils";
import { SafetyLine } from "@/components/claim/safety-line";

const text = {
  muted: "font-sans text-lg text-muted",
  fg: "font-sans text-lg text-fg",
  danger: "font-sans text-lg text-danger",
};

export const RECIPIENT_COPY = "Tokens always go to the listed wallet, not the wallet paying gas.";

interface ClaimForPanelProps {
  pool: AirdropPool;
  /** Pool meta.json (already token-checked against VENT by loadPoolMeta). */
  meta: PoolMeta | undefined;
  metaPending: boolean;
  metaFailed: boolean;
  onRetryMeta: () => void;
  /** Same page-side gate as the normal claim (window open, contract set, proofs ready). */
  claimable: boolean;
  /** Hard stop from the shared safety checks (bad meta, token/root mismatch). */
  safetyError: string | null;
}

/**
 * "Claim for another wallet": the connected wallet pays gas and calls
 * VentAirdrop.claimFor(account, amount, proof). The proof is for `account` and the
 * contract always sends VENT to `account`. Collapsed by default under the normal claim.
 */
export function ClaimForPanel(props: ClaimForPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="flex flex-col gap-3 border-t-2 border-border pt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-fit items-center gap-2 font-sans text-lg text-accent underline underline-offset-4 hover:brightness-110"
      >
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        Claim for another wallet
      </button>
      {open ? (
        <div id={panelId}>
          <ClaimForBody {...props} />
        </div>
      ) : null}
    </div>
  );
}

function ClaimForBody({
  pool,
  meta,
  metaPending,
  metaFailed,
  onRetryMeta,
  claimable,
  safetyError,
}: ClaimForPanelProps) {
  const inputId = useId();
  const { address: payer, isConnected, chainId } = useConnection();
  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const base = poolProofsBase(pool);
  const proofsReady = poolProofsReady(pool);
  const demo = pool.demoClaimed !== undefined;

  const [raw, setRaw] = useState("");
  const account = parseListedAddress(raw); // lowercase, or null
  const invalid = raw.trim() !== "" && account === null;
  const isSelf = Boolean(account && payer && account === payer.toLowerCase());

  // The listed wallet's shard only; proof verified against meta.root inside loadProof.
  const proofQuery = useQuery({
    queryKey: ["vent-proof", pool.id, base, account, meta?.root],
    queryFn: ({ signal }) => loadProof(base!, pool.id, account!, meta!, signal),
    enabled: Boolean(account && meta && !safetyError),
    staleTime: 10 * 60_000,
    retry: (count, err) => !(err instanceof ProofDataError) && count < 1,
  });
  const entry = proofQuery.data?.eligible ? proofQuery.data.entry : null;

  const contract = pool.contract ?? undefined;
  const isClaimedQuery = useReadContract({
    address: contract,
    abi: VENT_AIRDROP_ABI,
    functionName: "isClaimed",
    args: account ? [account] : undefined,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(contract && account && entry) },
  });
  const canClaimQuery = useReadContract({
    address: contract,
    abi: VENT_AIRDROP_ABI,
    functionName: "canClaim",
    args: account && entry ? [account, entry.amount, entry.proof] : undefined,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(contract && account && entry && claimable) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(write.data) },
  });
  const switchChain = useSwitchChain();
  // Recipient of the tx in flight / last sent, so the success copy can't drift from the input.
  const [sentFor, setSentFor] = useState<Address | null>(null);
  // Demo only: addresses "claimed" in this session via the simulated claim.
  const [demoDone, setDemoDone] = useState<readonly Address[]>([]);

  const refetchClaimed = isClaimedQuery.refetch;
  useEffect(() => {
    if (receipt.data?.status === "success") void refetchClaimed();
  }, [receipt.data?.status, refetchClaimed]);

  const busy = write.isPending || receipt.isLoading;
  // Success is always tied to the address the claim was sent for, never to later input.
  const success =
    sentFor !== null &&
    sentFor === account &&
    (receipt.data?.status === "success" || (demo && demoDone.includes(sentFor)));
  const demoClaimed = Boolean(
    account && demo && [...(pool.demoClaimed ?? []), ...demoDone].includes(account),
  );
  const claimed = success || demoClaimed || isClaimedQuery.data === true;
  const proofRejected = claimable && !claimed && canClaimQuery.data === false;

  function onInput(value: string) {
    setRaw(value);
    if (!busy && (write.data || write.error)) {
      write.reset();
      setSentFor(null);
    }
  }

  function onClaimFor() {
    // Guarded: unreachable while `pool.contract` is null (button disabled).
    if (!pool.contract || !account || !entry || !claimable || isSelf || claimed) return;
    // VentAirdrop.claimFor(address account, uint256 amount, bytes32[] proof): msg.sender pays
    // gas; the leaf is built from `account` and VENT is transferred to `account`.
    setSentFor(account);
    write.mutate({
      address: pool.contract,
      abi: VENT_AIRDROP_ABI,
      functionName: "claimFor",
      args: [account, entry.amount, entry.proof],
      chainId: TARGET_CHAIN.id,
    });
  }

  function onDemoClaimFor() {
    if (!demo || !account || !entry || isSelf || claimed || !isConnected) return;
    setDemoDone((d) => [...d, account]);
    setSentFor(account);
  }

  const dataError =
    safetyError || (proofQuery.error instanceof ProofDataError && proofQuery.error.message) || null;

  let status: React.ReactNode = null;
  if (dataError) {
    status = (
      <p className={cn(text.danger, "flex items-start gap-2")}>
        <AlertTriangle className="mt-1 size-4 shrink-0" /> {dataError}
      </p>
    );
  } else if (!proofsReady) {
    status = (
      <p className={text.muted}>
        {pool.status === "snapshot-pending"
          ? "Snapshot not taken yet. Holders are checked after the NFT mint closes."
          : "Eligibility list not published yet. Check back when claims open."}
      </p>
    );
  } else if (invalid) {
    status = <p className={text.danger}>That is not a valid wallet address.</p>;
  } else if (!account) {
    status = null;
  } else if (metaPending || (meta && proofQuery.isPending)) {
    status = (
      <p className={cn(text.muted, "flex items-center gap-2")}>
        <Loader2 className="size-4 animate-spin" /> Checking listed wallet…
      </p>
    );
  } else if (metaFailed || proofQuery.isError) {
    status = (
      <div className="flex flex-wrap items-center gap-3">
        <p className={text.danger}>Couldn&apos;t load eligibility.</p>
        <Button
          variant="ghost"
          onClick={() => (metaFailed ? onRetryMeta() : void proofQuery.refetch())}
        >
          Retry
        </Button>
      </div>
    );
  } else if (!entry) {
    status = (
      <p className={text.fg}>
        {shortAddress(account)} is not eligible for {pool.shortName}.
      </p>
    );
  } else {
    status = (
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-accent sm:text-pixel">
          {claimed ? "Listed wallet · Claimed" : "Listed wallet · Eligible"}
        </p>
        <p className="break-all font-display text-pixel-lg text-fg sm:text-pixel-xl">
          {formatVentExact(entry.amount)} <span className="text-accent">VENT</span>
        </p>
        {claimed && !success ? (
          <p className={cn(text.fg, "flex items-center gap-2")}>
            <CheckCircle2 className="size-4 text-accent" /> Already claimed to{" "}
            {shortAddress(account)}.
          </p>
        ) : null}
        {isSelf && !claimed ? (
          <p className={text.muted}>
            This is your connected wallet. Use the normal Claim button above.
          </p>
        ) : null}
        {proofRejected ? (
          <p className={text.danger}>The contract rejected this proof. Do not retry; ask in TG.</p>
        ) : null}
        {!claimable && !claimed && !demo ? (
          <p className={text.muted}>{pool.statusLabel}. Nothing to do yet.</p>
        ) : null}
      </div>
    );
  }

  const showSummary = Boolean(account && entry && !dataError && !isSelf);

  let button: React.ReactNode = null;
  if (showSummary && entry && account) {
    if (success) button = <Button disabled>Claimed</Button>;
    else if (claimed) button = <Button disabled>Already claimed</Button>;
    else if (demo) {
      button = isConnected ? (
        <Button variant="secondary" onClick={onDemoClaimFor}>
          Simulate claim for {shortAddress(account)} (demo)
        </Button>
      ) : (
        <Button disabled>Connect a wallet to pay gas</Button>
      );
    } else if (!claimable) button = <Button disabled>{pool.statusLabel}</Button>;
    else if (!isConnected) button = <Button disabled>Connect a wallet to pay gas</Button>;
    else if (wrongNetwork)
      button = (
        <Button
          disabled={switchChain.isPending}
          onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
        >
          Switch to {VENT.chainName}
        </Button>
      );
    else if (proofRejected || canClaimQuery.isPending || isClaimedQuery.isPending)
      button = <Button disabled>{proofRejected ? "Cannot claim" : "Checking…"}</Button>;
    else if (write.isPending) button = <Button disabled>Confirm in wallet…</Button>;
    else if (receipt.isLoading) button = <Button disabled>Claiming…</Button>;
    else
      button = (
        <Button onClick={onClaimFor}>
          Claim {formatVentExact(entry.amount)} VENT to {shortAddress(account)}
        </Button>
      );
  }

  return (
    <div className="flex flex-col gap-4 border-2 border-border bg-bg p-4">
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-muted">Claim for another wallet</p>
        <p className={text.muted}>
          Pay the gas for a wallet that is on the list, e.g. one with no ETH on {VENT.chainName}.
        </p>
        <p className={cn(text.fg, "font-semibold")}>{RECIPIENT_COPY}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-display text-micro uppercase text-muted">
          Listed wallet address
        </label>
        <Input
          id={inputId}
          value={raw}
          onChange={(e) => onInput(e.target.value)}
          placeholder="0x…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          disabled={busy}
          aria-invalid={invalid || undefined}
        />
        {demo ? (
          <p className="font-sans text-base text-muted">
            Demo: try <span className="break-all text-fg">{DEMO_LISTED_ADDRESS}</span> (listed) or{" "}
            <span className="break-all text-fg">{DEMO_CLAIMED_ADDRESS}</span> (already claimed).
          </p>
        ) : null}
      </div>

      {status}

      {showSummary && account ? (
        <dl className="grid gap-3 border-2 border-dashed border-border p-3 font-sans text-base">
          <div className="flex flex-col">
            <dt className="font-display text-micro uppercase text-muted">
              Receives VENT (listed wallet)
            </dt>
            <dd className="break-all text-fg">{account}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-display text-micro uppercase text-muted">
              Pays gas (your connected wallet)
            </dt>
            <dd className="break-all text-fg">{payer ? payer.toLowerCase() : "Not connected"}</dd>
          </div>
        </dl>
      ) : null}

      {button ? <div className="flex flex-col gap-2">{button}</div> : null}

      {write.error ? (
        <p className="font-sans text-base text-danger">
          {isUserRejection(write.error)
            ? "Transaction rejected in wallet."
            : "Claim failed. This wallet may already be claimed, or you need a little ETH for gas."}
        </p>
      ) : null}
      {receipt.data?.status === "reverted" ? (
        <p className="font-sans text-base text-danger">
          Transaction reverted. Nothing was claimed. Check the listed wallet and try again.
        </p>
      ) : null}
      {success && sentFor ? (
        <p className={cn(text.fg, "flex items-center gap-2")}>
          <CheckCircle2 className="size-4 shrink-0 text-accent" /> Claimed to{" "}
          {shortAddress(sentFor)}
          {demo && !write.data ? " (demo: no transaction sent)" : ""}
        </p>
      ) : null}
      {write.data ? (
        <a
          href={VENT.explorerTxUrl(write.data)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-sans text-base text-accent underline underline-offset-4"
        >
          View transaction on Arbiscan <ExternalLink className="size-4" />
        </a>
      ) : null}

      {showSummary ? <SafetyLine /> : null}
    </div>
  );
}
