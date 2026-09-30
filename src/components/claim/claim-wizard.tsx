import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useReadContracts,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { type Address, type Hash, type Hex } from "viem";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClaimCountdown } from "@/components/claim/claim-countdown";
import { SafetyLine } from "@/components/claim/safety-line";
import { useMounted } from "@/components/claim/use-mounted";
import { useNow } from "@/components/claim/use-now";
import {
  CLAIM_DOMAIN,
  COMMUNITY_OPENS_AT,
  DISTRIBUTION,
  VENT,
  formatCompactTokens,
  formatOpensAt,
  formatVentExact,
  isUserRejection,
  parseListedAddress,
  shortAddress,
} from "@/lib/airdrop";
import {
  lookupBoth,
  nftAmountCopy,
  type CombinedEligibility,
  type CommunityLookup,
  type NftLookup,
} from "@/lib/eligibility";
import {
  REGISTRATION,
  VENT_REGISTRATION_ABI,
  VENTRAN_OPENSEA_URL,
  buildSetClaimWalletTypedData,
  loadRemap,
  registrationFeeLabel,
  saveRemap,
} from "@/lib/register";
import {
  feeDiffersBeyondTolerance,
  fetchEthUsd,
  formatEthExact,
  usdToEthWei,
} from "@/lib/eth-price";
import { OPENSEA_URL } from "@/lib/drop";
import { TARGET_CHAIN } from "@/lib/wagmi";
import { cn } from "@/lib/utils";

export type WizardStep =
  | "wallet"
  | "eligibility"
  | "allocation"
  | "remap"
  | "register"
  | "done";

const STEPS: { id: WizardStep; label: string; n: string }[] = [
  { id: "wallet", label: "Wallet", n: "01" },
  { id: "eligibility", label: "Check", n: "02" },
  { id: "allocation", label: "Allocation", n: "03" },
  { id: "remap", label: "Remap", n: "04" },
  { id: "register", label: "Register", n: "05" },
  { id: "done", label: "Claim", n: "06" },
];

function Frame({
  title,
  n,
  children,
  icon,
}: {
  title: string;
  n?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-surface p-5 sm:p-7">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon ?? (
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-fg">
              V
            </span>
          )}
          <h2 className="text-lg font-semibold text-fg sm:text-xl">{title}</h2>
        </div>
        {n ? <span className="font-sans text-xs text-muted">{n}</span> : null}
      </header>
      {children}
    </section>
  );
}

function StepRail({ step }: { step: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="mb-6 flex flex-wrap gap-2">
      {STEPS.map((s, i) => {
        const active = s.id === step;
        const done = i < idx;
        const skipRemap = step !== "remap" && s.id === "remap" && idx > 3;
        return (
          <li
            key={s.id}
            className={cn(
              "border px-2.5 py-1 font-sans text-xs",
              active && "border-fg bg-accent text-fg",
              done && !active && "border-fg text-fg",
              !active && !done && "border-border text-muted",
              skipRemap && "opacity-40",
            )}
          >
            {s.n} {s.label}
          </li>
        );
      })}
    </ol>
  );
}

function DistributionBlurb() {
  return (
    <div className="flex flex-col gap-3 border border-border bg-bg p-4">
      <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
        How distribution works
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 font-sans text-sm text-fg">
        <li>
          <strong>{formatCompactTokens(DISTRIBUTION.liquidity)}</strong> VENT liquidity
        </li>
        <li>
          <strong>{formatCompactTokens(DISTRIBUTION.community)}</strong> VENT community airdrop
        </li>
        <li>
          <strong>{formatCompactTokens(DISTRIBUTION.nft)}</strong> VENT NFT holders
        </li>
        <li>No team share</li>
      </ul>
      <p className="font-sans text-sm text-muted">
        Official NFT:{" "}
        <a
          href={OPENSEA_URL || VENTRAN_OPENSEA_URL}
          target="_blank"
          rel="noreferrer"
          className="text-fg underline underline-offset-4"
        >
          OpenSea · Ventran
        </a>
        .
      </p>
    </div>
  );
}

function CommunityStatus({ c, demo }: { c: CommunityLookup; demo: boolean }) {
  if (c.status === "not-yet-published") {
    return (
      <p className="font-sans text-sm text-muted">
        Community eligibility list not yet published. Check back when proofs go live
        {demo ? "." : " — or try ?demo=1 to preview the flow."}
      </p>
    );
  }
  if (c.status === "eligible") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-fg">Eligible</p>
        <p className="text-2xl font-semibold text-fg">
          {formatVentExact(c.amountWei)} <span className="text-base font-medium">VENT</span>
        </p>
        {c.note ? <p className="font-sans text-sm text-muted">{c.note}</p> : null}
      </div>
    );
  }
  if (c.status === "not-eligible") {
    return <p className="font-sans text-sm text-fg">Not eligible for the community pool.</p>;
  }
  return <p className="font-sans text-sm text-danger">{c.message}</p>;
}

function NftStatus({ n }: { n: NftLookup }) {
  if (n.status === "eligible") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-sans text-xs font-medium uppercase tracking-wider text-fg">Eligible</p>
        <p className="font-sans text-sm text-fg">{nftAmountCopy(n.tokenCount)}</p>
      </div>
    );
  }
  if (n.status === "not-eligible") {
    return <p className="font-sans text-sm text-fg">Not eligible for the NFT pool.</p>;
  }
  return <p className="font-sans text-sm text-danger">{n.message}</p>;
}

function hasInjectedProvider(): boolean {
  return typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
}

const REMAP_DEADLINE_SECS = 60 * 60; // 1 hour

export function ClaimWizard({ demo = false }: { demo?: boolean }) {
  const mounted = useMounted();
  const now = useNow();
  const { address, isConnected, chainId, connector } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const signTyped = useSignTypedData();

  const [step, setStep] = useState<WizardStep>("wallet");
  const [pasted, setPasted] = useState("");
  const [eligibleWallet, setEligibleWallet] = useState<Address | null>(null);
  const [compromised, setCompromised] = useState<boolean | null>(null);
  const [remapInput, setRemapInput] = useState("");
  const [remapError, setRemapError] = useState<string | null>(null);
  const [destinationWallet, setDestinationWallet] = useState<Address | null>(null);
  const [demoTxHash, setDemoTxHash] = useState<Hash | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [pendingPhase, setPendingPhase] = useState<"idle" | "remap-sign" | "remap-tx" | "register">(
    "idle",
  );

  const injectedAvailable = mounted && hasInjectedProvider();
  const visibleConnectors = useMemo(() => {
    const named = connectors.filter((c) => c.type === "injected" && c.id !== "injected");
    const mocks = connectors.filter((c) => c.type === "mock");
    const generic = connectors.filter((c) => c.id === "injected");
    const list = [...named, ...mocks];
    if (named.length === 0 && injectedAvailable) list.unshift(...generic);
    return list;
  }, [connectors, injectedAvailable]);

  const eligibilityQuery = useQuery({
    queryKey: ["vent-eligibility", eligibleWallet, demo],
    queryFn: () => lookupBoth(eligibleWallet!, { demo }),
    enabled:
      Boolean(eligibleWallet) &&
      (step === "eligibility" ||
        step === "allocation" ||
        step === "remap" ||
        step === "register" ||
        step === "done"),
    staleTime: 5 * 60_000,
  });

  const result = eligibilityQuery.data as CombinedEligibility | undefined;

  const priceQuery = useQuery({
    queryKey: ["eth-usd"],
    queryFn: fetchEthUsd,
    staleTime: 60_000,
    refetchInterval: 120_000,
    enabled: step === "register" || step === "done" || step === "allocation",
  });

  const contract = REGISTRATION.contract;
  const contractSet = REGISTRATION.contractSet && contract !== null;

  const onChainGlobal = useReadContracts({
    contracts: [
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "registrationFee",
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "feeRecipient",
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "registrationOpen",
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "paused",
        chainId: TARGET_CHAIN.id,
      },
    ] as const,
    query: { enabled: contractSet, staleTime: 30_000 },
  });

  const eligibleForReads = eligibleWallet ?? ("0x0000000000000000000000000000000000000000" as Address);
  const onChainEligible = useReadContracts({
    contracts: [
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "isRegistered",
        args: [eligibleForReads],
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "effectiveClaimWallet",
        args: [eligibleForReads],
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "nonces",
        args: [eligibleForReads],
        chainId: TARGET_CHAIN.id,
      },
      {
        address: contract ?? "0x0000000000000000000000000000000000000000",
        abi: VENT_REGISTRATION_ABI,
        functionName: "remapped",
        args: [eligibleForReads],
        chainId: TARGET_CHAIN.id,
      },
    ] as const,
    query: { enabled: contractSet && Boolean(eligibleWallet), staleTime: 30_000 },
  });

  const onChainFee =
    onChainGlobal.data?.[0]?.status === "success"
      ? (onChainGlobal.data[0].result as bigint)
      : null;
  const onChainFeeRecipient =
    onChainGlobal.data?.[1]?.status === "success"
      ? (onChainGlobal.data[1].result as Address)
      : null;
  const registrationOpen =
    onChainGlobal.data?.[2]?.status === "success"
      ? Boolean(onChainGlobal.data[2].result)
      : null;
  const paused =
    onChainGlobal.data?.[3]?.status === "success"
      ? Boolean(onChainGlobal.data[3].result)
      : null;
  const alreadyRegistered =
    eligibleWallet && onChainEligible.data?.[0]?.status === "success"
      ? Boolean(onChainEligible.data[0].result)
      : null;
  const effectiveClaim =
    eligibleWallet && onChainEligible.data?.[1]?.status === "success"
      ? (onChainEligible.data[1].result as Address)
      : null;
  const onChainNonce =
    eligibleWallet && onChainEligible.data?.[2]?.status === "success"
      ? (onChainEligible.data[2].result as bigint)
      : null;
  const alreadyRemapped =
    eligibleWallet && onChainEligible.data?.[3]?.status === "success"
      ? Boolean(onChainEligible.data[3].result)
      : null;

  const quoteWei = useMemo(() => {
    if (!priceQuery.data?.usd) return null;
    try {
      return usdToEthWei(REGISTRATION.feeUsd, priceQuery.data.usd);
    } catch {
      return null;
    }
  }, [priceQuery.data?.usd]);

  /** Amount to send: prefer on-chain fee when set; else live quote. */
  const payWei = onChainFee ?? quoteWei;

  const feeMismatch =
    contractSet &&
    onChainFee !== null &&
    quoteWei !== null &&
    feeDiffersBeyondTolerance(quoteWei, onChainFee, REGISTRATION.feeTolerance);

  // Restore remap from localStorage (UX cache only)
  useEffect(() => {
    if (!eligibleWallet) return;
    const existing = loadRemap(eligibleWallet);
    if (existing) {
      setDestinationWallet(existing.destination as Address);
      setCompromised(true);
    }
  }, [eligibleWallet]);

  // Prefer on-chain effective claim wallet when available
  const registerAs: Address | null =
    (effectiveClaim as Address | null) ?? destinationWallet ?? eligibleWallet;

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(write.data) },
  });

  useEffect(() => {
    if (receipt.data?.status === "success") {
      if (pendingPhase === "remap-tx") {
        setPendingPhase("idle");
        setStep("register");
        void onChainGlobal.refetch();
        void onChainEligible.refetch();
      } else if (pendingPhase === "register" || pendingPhase === "idle") {
        setPendingPhase("idle");
        setStep("done");
      }
    }
  }, [receipt.data?.status, pendingPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const goCheck = useCallback((wallet: Address) => {
    setEligibleWallet(wallet);
    setStep("eligibility");
    setCompromised(null);
    setDemoTxHash(null);
    setRegisterError(null);
    setPendingPhase("idle");
  }, []);

  function onUseConnected() {
    if (!address) return;
    goCheck(address.toLowerCase() as Address);
  }

  function onPasteCheck() {
    const parsed = parseListedAddress(pasted);
    if (!parsed) return;
    goCheck(parsed);
  }

  function onAllocationContinue() {
    if (compromised === true) {
      setStep("remap");
      return;
    }
    if (compromised === false) {
      setDestinationWallet(null);
      setStep("register");
    }
  }

  async function onSaveRemap() {
    setRemapError(null);
    const parsed = parseListedAddress(remapInput);
    if (!parsed) {
      setRemapError("Enter a valid EVM address (0x…).");
      return;
    }
    if (eligibleWallet && parsed.toLowerCase() === eligibleWallet.toLowerCase()) {
      setRemapError("Destination must be a different wallet than the eligible one.");
      return;
    }
    if (!eligibleWallet) return;

    // Always cache for UX
    saveRemap(eligibleWallet, parsed);
    setDestinationWallet(parsed);

    // Without contract: local cache only (demo / pre-deploy)
    if (!contractSet || !contract) {
      if (demo) {
        setStep("register");
        return;
      }
      setRemapError(
        "Registration contract not deployed yet — remap saved locally. On-chain remap will run once the contract address is set.",
      );
      setStep("register");
      return;
    }

    if (alreadyRemapped) {
      setRemapError("This eligible wallet was already remapped on-chain.");
      return;
    }
    if (alreadyRegistered) {
      setRemapError("Already registered — remap is only allowed before register.");
      return;
    }
    if (!isConnected || !address) {
      setRemapError("Connect the eligible wallet to sign the remap.");
      return;
    }
    if (address.toLowerCase() !== eligibleWallet.toLowerCase()) {
      setRemapError(
        `Connect ${shortAddress(eligibleWallet)} — the eligible wallet must sign EIP-712.`,
      );
      return;
    }
    if (chainId !== TARGET_CHAIN.id) {
      switchChain.mutate({ chainId: TARGET_CHAIN.id });
      return;
    }
    if (onChainNonce === null) {
      setRemapError("Could not read on-chain nonce — try again.");
      return;
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + REMAP_DEADLINE_SECS);
    const typed = buildSetClaimWalletTypedData({
      verifyingContract: contract,
      chainId: TARGET_CHAIN.id,
      eligible: eligibleWallet,
      newClaimWallet: parsed,
      nonce: onChainNonce,
      deadline,
    });

    try {
      setPendingPhase("remap-sign");
      const signature = (await signTyped.mutateAsync({
        ...typed,
      })) as Hex;
      setPendingPhase("remap-tx");
      write.mutate({
        address: contract,
        abi: VENT_REGISTRATION_ABI,
        functionName: "setClaimWallet",
        args: [eligibleWallet, parsed, deadline, signature],
        chainId: TARGET_CHAIN.id,
      });
    } catch (err) {
      setPendingPhase("idle");
      if (isUserRejection(err)) {
        setRemapError("Signature rejected in wallet.");
      } else {
        setRemapError(err instanceof Error ? err.message : "Remap failed.");
      }
    }
  }

  function onPayRegister() {
    setRegisterError(null);
    if (!contractSet || !contract) {
      setRegisterError("Registration contract not set yet — waiting on deploy.");
      return;
    }
    if (!isConnected || !address) {
      setRegisterError("Connect the wallet that will be written on-chain (claim wallet).");
      return;
    }
    if (registerAs && address.toLowerCase() !== registerAs.toLowerCase()) {
      setRegisterError(
        `Connect ${shortAddress(registerAs)} — that is the effective claim wallet.`,
      );
      return;
    }
    if (!eligibleWallet) {
      setRegisterError("Missing eligible wallet.");
      return;
    }
    if (alreadyRegistered) {
      setRegisterError("Already registered on-chain.");
      return;
    }
    if (paused) {
      setRegisterError("Registration is paused.");
      return;
    }
    if (registrationOpen === false) {
      setRegisterError("Registration is not open yet.");
      return;
    }
    if (feeMismatch) {
      setRegisterError(
        `On-chain fee is ${formatEthExact(onChainFee!)} ETH; live quote is ${formatEthExact(quoteWei!)} ETH (>${REGISTRATION.feeTolerance * 100}% drift). Refresh or wait for owner update.`,
      );
      return;
    }
    if (payWei === null) {
      setRegisterError("Could not determine fee amount — wait for price / on-chain fee.");
      return;
    }
    if (chainId !== TARGET_CHAIN.id) {
      switchChain.mutate({ chainId: TARGET_CHAIN.id });
      return;
    }

    // Native ETH msg.value — never ARB approve/transfer
    setPendingPhase("register");
    write.mutate({
      address: contract,
      abi: VENT_REGISTRATION_ABI,
      functionName: "register",
      args: [eligibleWallet],
      value: payWei,
      chainId: TARGET_CHAIN.id,
    });
  }

  function onDemoRegister() {
    const fake = ("0x" + "ab".repeat(32)) as Hash;
    setDemoTxHash(fake);
    setStep("done");
  }

  useEffect(() => {
    if (step === "eligibility" && eligibilityQuery.isSuccess && result) {
      setStep("allocation");
    }
  }, [step, eligibilityQuery.isSuccess, result]);

  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const feeLabel = registrationFeeLabel(payWei, priceQuery.data?.usd ?? null);
  const displayFeeRecipient = onChainFeeRecipient ?? REGISTRATION.feeRecipient;

  return (
    <div className="flex flex-col gap-6">
      <StepRail step={step} />

      {step === "wallet" ? (
        <Frame title="Eligibility wallet" n="01">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-sm text-muted sm:text-base">
              Enter or connect the wallet used for eligibility (waitlist / NFT holder). Checking is
              free and never asks for a signature.
            </p>

            {mounted && isConnected && address ? (
              <div className="flex flex-col gap-3 border border-border bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Wallet className="size-5 text-fg" />
                    <div>
                      <p className="font-semibold text-fg">{shortAddress(address)}</p>
                      <p className="font-sans text-sm text-muted">
                        {connector?.type === "mock"
                          ? "Demo wallet (mock)"
                          : (connector?.name ?? "Wallet")}{" "}
                        · {wrongNetwork ? "wrong network" : VENT.chainName}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => disconnect.mutate()}>
                    Disconnect
                  </Button>
                </div>
                {wrongNetwork ? (
                  <Button
                    className="w-fit"
                    disabled={switchChain.isPending}
                    onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
                  >
                    Switch to {VENT.chainName}
                  </Button>
                ) : (
                  <Button className="w-fit" onClick={onUseConnected}>
                    Check this wallet <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            ) : mounted ? (
              <div className="flex flex-col gap-3">
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
                  Connect
                </p>
                <div className="flex flex-wrap gap-3">
                  {visibleConnectors.map((c) => (
                    <Button
                      key={c.uid}
                      variant={c.type === "mock" ? "secondary" : "primary"}
                      disabled={connect.isPending}
                      onClick={() => connect.mutate({ connector: c, chainId: TARGET_CHAIN.id })}
                    >
                      <Wallet className="size-4" />
                      {c.type === "mock"
                        ? "Demo wallet"
                        : c.id === "injected"
                          ? "Connect wallet"
                          : c.name}
                    </Button>
                  ))}
                </div>
                {connect.error ? (
                  <p className="font-sans text-sm text-danger">
                    {isUserRejection(connect.error)
                      ? "Request rejected in wallet."
                      : "Couldn't connect. Unlock your wallet and try again."}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="font-sans text-sm text-muted">Loading wallet…</p>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
                Or paste an address
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="0x…"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
                <Button
                  disabled={!parseListedAddress(pasted)}
                  onClick={onPasteCheck}
                  className="shrink-0"
                >
                  Check eligibility
                </Button>
              </div>
            </div>
          </div>
        </Frame>
      ) : null}

      {step === "eligibility" ? (
        <Frame title="Checking eligibility" n="02">
          <div className="flex flex-col gap-4">
            <p className="font-sans text-sm text-muted">
              Looking up{" "}
              <span className="font-semibold text-fg">
                {eligibleWallet ? shortAddress(eligibleWallet) : "…"}
              </span>{" "}
              against community + NFT lists…
            </p>
            {eligibilityQuery.isPending || eligibilityQuery.isFetching ? (
              <p className="flex items-center gap-2 font-sans text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Checking…
              </p>
            ) : eligibilityQuery.isError ? (
              <div className="flex flex-col gap-3">
                <p className="font-sans text-sm text-danger">Couldn&apos;t load eligibility.</p>
                <Button variant="secondary" onClick={() => void eligibilityQuery.refetch()}>
                  Retry
                </Button>
              </div>
            ) : null}
            <Button variant="ghost" className="w-fit" onClick={() => setStep("wallet")}>
              <ArrowLeft className="size-4" /> Change wallet
            </Button>
          </div>
        </Frame>
      ) : null}

      {step === "allocation" && result ? (
        <Frame title="Your allocation" n="03">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-sm text-muted">
              Results for{" "}
              <span className="font-semibold text-fg">{shortAddress(result.address)}</span>
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-border bg-bg p-4">
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted">
                  Community · {formatCompactTokens(DISTRIBUTION.community)} VENT
                </p>
                <CommunityStatus c={result.community} demo={demo} />
              </div>
              <div className="border border-border bg-bg p-4">
                <p className="mb-2 font-sans text-xs font-medium uppercase tracking-wider text-muted">
                  NFT holders · {formatCompactTokens(DISTRIBUTION.nft)} VENT
                </p>
                <NftStatus n={result.nft} />
              </div>
            </div>

            <DistributionBlurb />

            <div className="flex flex-col gap-3 border border-border bg-bg p-4">
              <p className="font-sans text-xs font-medium uppercase tracking-wider text-fg">
                Is this eligibility wallet compromised?
              </p>
              <p className="font-sans text-sm text-muted">
                If the wallet is unsafe, you can remap once to a new claim wallet. The eligible
                wallet signs once; remap is one-time.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={compromised === false ? "primary" : "secondary"}
                  onClick={() => setCompromised(false)}
                >
                  Not compromised — continue
                </Button>
                <Button
                  variant={compromised === true ? "primary" : "secondary"}
                  onClick={() => setCompromised(true)}
                >
                  Compromised — remap
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setStep("wallet")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button disabled={compromised === null} onClick={onAllocationContinue}>
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </Frame>
      ) : null}

      {step === "remap" ? (
        <Frame
          title="Remap claim wallet"
          n="04"
          icon={
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-fg text-[11px] font-bold text-bg">
              R
            </span>
          }
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border border-danger bg-[#fdf6f6] p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" />
              <div className="flex flex-col gap-2">
                <p className="font-sans text-xs font-medium uppercase tracking-wider text-danger">
                  One-time on-chain remap
                </p>
                <p className="font-sans text-sm text-fg">
                  Submit a <strong>new</strong> claim wallet. The <strong>eligible</strong> wallet
                  signs EIP-712 <code className="text-xs">SetClaimWallet</code>, then{" "}
                  <code className="text-xs">setClaimWallet</code> is submitted on-chain. After
                  remap, the new wallet pays the registration fee.
                </p>
                <p className="font-sans text-sm text-muted">
                  Eligible wallet:{" "}
                  <span className="text-fg">
                    {eligibleWallet ? shortAddress(eligibleWallet) : "—"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-sans text-xs font-medium uppercase tracking-wider text-muted" htmlFor="remap-addr">
                New claim wallet
              </label>
              <Input
                id="remap-addr"
                placeholder="0x…"
                value={remapInput}
                onChange={(e) => {
                  setRemapInput(e.target.value);
                  setRemapError(null);
                }}
                spellCheck={false}
                autoComplete="off"
              />
              {remapError ? <p className="font-sans text-sm text-danger">{remapError}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setStep("allocation")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                disabled={pendingPhase === "remap-sign" || pendingPhase === "remap-tx" || write.isPending}
                onClick={() => void onSaveRemap()}
              >
                {pendingPhase === "remap-sign"
                  ? "Sign in wallet…"
                  : pendingPhase === "remap-tx" || write.isPending
                    ? "Submitting remap…"
                    : contractSet
                      ? "Sign & submit remap"
                      : "Save remap & continue"}
              </Button>
            </div>
          </div>
        </Frame>
      ) : null}

      {step === "register" ? (
        <Frame title="Register" n="05">
          <div className="flex flex-col gap-5">
            {contractSet && registrationOpen === false ? (
              <div className="border border-[#e8d48b] bg-[#fbf6e6] px-4 py-3 font-sans text-sm text-fg">
                Registration is not open yet. You can check eligibility and prepare a remap; the
                register button stays disabled until the owner opens registration on-chain.
              </div>
            ) : null}
            {contractSet && paused === true ? (
              <div className="border border-danger bg-[#fdecea] px-4 py-3 font-sans text-sm text-danger">
                Registration is paused on-chain.
              </div>
            ) : null}
            <div className="border border-border bg-bg p-4">
              <p className="font-sans text-sm text-fg">
                Confirm registration in your wallet on {VENT.chainName}. Your wallet will show the
                exact amount before you approve.
              </p>
              {feeMismatch ? (
                <p className="mt-2 flex items-start gap-2 font-sans text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  On-chain fee does not match the live quote. Refresh or wait for owner update —
                  submit blocked.
                </p>
              ) : null}
            </div>

            <dl className="grid gap-3 font-sans text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Eligible wallet
                </dt>
                <dd className="text-fg">{eligibleWallet ? shortAddress(eligibleWallet) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Claim wallet (pays fee)
                </dt>
                <dd className="text-fg">
                  {registerAs ? shortAddress(registerAs) : "—"}
                  {destinationWallet || (effectiveClaim && eligibleWallet && effectiveClaim.toLowerCase() !== eligibleWallet.toLowerCase())
                    ? " (remapped)"
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Fee recipient
                </dt>
                <dd className="break-all text-fg">
                  {REGISTRATION.feeRecipientSet ? (
                    <a
                      href={VENT.explorerAddressUrl(displayFeeRecipient)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {displayFeeRecipient}
                    </a>
                  ) : (
                    <span className="text-danger">Not set</span>
                  )}
                  <span className="mt-1 block text-xs text-muted">
                    On-chain fee recipient.
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted">
                  Registration contract
                </dt>
                <dd className="break-all text-fg">
                  {contractSet && contract ? (
                    contract
                  ) : (
                    <span className="text-danger">
                      Not deployed yet — pay disabled until Clanker sets the address
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {mounted && isConnected && address ? (
              <div className="border border-border bg-bg p-4">
                <p className="font-sans text-sm text-fg">
                  Connected: <span className="font-semibold">{shortAddress(address)}</span>
                  {registerAs && address.toLowerCase() !== registerAs.toLowerCase() ? (
                    <span className="mt-2 block text-danger">
                      Switch to {shortAddress(registerAs)} to register.
                    </span>
                  ) : (
                    <span className="mt-2 block text-muted">
                      Ready to register.
                    </span>
                  )}
                </p>
                <Button variant="ghost" className="mt-2" onClick={() => disconnect.mutate()}>
                  Disconnect
                </Button>
              </div>
            ) : mounted ? (
              <div className="flex flex-col gap-3">
                <p className="font-sans text-sm text-muted">
                  Connect the claim wallet that will be written on-chain
                  {registerAs ? ` (${shortAddress(registerAs)})` : ""}.
                </p>
                <div className="flex flex-wrap gap-3">
                  {visibleConnectors.map((c) => (
                    <Button
                      key={c.uid}
                      variant={c.type === "mock" ? "secondary" : "primary"}
                      disabled={connect.isPending}
                      onClick={() => connect.mutate({ connector: c, chainId: TARGET_CHAIN.id })}
                    >
                      <Wallet className="size-4" />
                      {c.type === "mock"
                        ? "Demo wallet"
                        : c.id === "injected"
                          ? "Connect wallet"
                          : c.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <SafetyLine />

            <div className="flex flex-wrap gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep(destinationWallet ? "remap" : "allocation")}
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                disabled={
                  !contractSet ||
                  write.isPending ||
                  receipt.isLoading ||
                  !isConnected ||
                  feeMismatch ||
                  payWei === null ||
                  Boolean(alreadyRegistered) ||
                  registrationOpen === false ||
                  paused === true
                }
                onClick={onPayRegister}
              >
                {!contractSet
                  ? "Contract not set yet"
                  : alreadyRegistered
                    ? "Already registered"
                    : paused === true
                      ? "Registration paused"
                      : registrationOpen === false
                        ? "Registration not open yet"
                        : write.isPending || pendingPhase === "register"
                          ? "Confirm in wallet…"
                          : receipt.isLoading
                            ? "Confirming…"
                            : "Register"}
              </Button>
              {demo && !contractSet ? (
                <Button variant="secondary" onClick={onDemoRegister}>
                  Demo: simulate register
                </Button>
              ) : null}
            </div>

            {registerError ? (
              <p className="flex items-start gap-2 font-sans text-sm text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {registerError}
              </p>
            ) : null}
            {write.error && pendingPhase === "register" ? (
              <p className="font-sans text-sm text-danger">
                {isUserRejection(write.error)
                  ? "Transaction rejected in wallet."
                  : "Register failed. You need enough ETH for the fee plus gas."}
              </p>
            ) : null}
            {write.data ? (
              <a
                href={VENT.explorerTxUrl(write.data)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-sans text-sm text-fg underline underline-offset-4"
              >
                View transaction <ExternalLink className="size-4" />
              </a>
            ) : null}
          </div>
        </Frame>
      ) : null}

      {step === "done" ? (
        <Frame title="Registered · claim soon" n="06">
          <div className="flex flex-col gap-5">
            <p className="flex items-center gap-2 text-base font-semibold text-fg">
              <CheckCircle2 className="size-5" /> Registration recorded
            </p>
            <p className="font-sans text-sm text-muted">
              Claims open {formatOpensAt(COMMUNITY_OPENS_AT)}. The claim button stays disabled until
              then — registration is the gate for now.
            </p>
            {(write.data || demoTxHash) && (
              <p className="font-sans text-sm text-muted">
                Tx:{" "}
                {write.data ? (
                  <a
                    href={VENT.explorerTxUrl(write.data)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg underline underline-offset-4"
                  >
                    {shortAddress(write.data)}
                  </a>
                ) : (
                  <span className="text-fg">{demoTxHash} (demo)</span>
                )}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
                Countdown to claim
              </p>
              <ClaimCountdown target={COMMUNITY_OPENS_AT} now={now} />
            </div>
            <Button disabled>Claim opens {formatOpensAt(COMMUNITY_OPENS_AT)}</Button>
            <SafetyLine />
            <p className="font-sans text-sm text-muted">
              Official domain only: <strong className="text-fg">{CLAIM_DOMAIN}</strong>. Never share
              your seed phrase.
            </p>
            <Button variant="ghost" className="w-fit" onClick={() => setStep("wallet")}>
              Start over
            </Button>
          </div>
        </Frame>
      ) : null}
    </div>
  );
}
