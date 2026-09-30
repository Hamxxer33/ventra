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
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { type Address, type Hash } from "viem";
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
  ARB_ERC20_ABI,
  ARB_TOKEN,
  REGISTRATION,
  VENTRAN_OPENSEA_URL,
  loadRemap,
  registrationFeeLabel,
  registrationFeeWei,
  saveRemap,
} from "@/lib/register";
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
}: {
  title: string;
  n?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-2 border-accent bg-surface p-5 shadow-pixel sm:p-8">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-pixel text-fg sm:text-pixel-lg">{title}</h2>
        {n ? <span className="font-display text-pixel text-muted">{n}</span> : null}
      </header>
      {children}
    </section>
  );
}

function StepRail({ step }: { step: WizardStep }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((s, i) => {
        const active = s.id === step;
        const done = i < idx;
        // Remap is optional — dim it when skipping visually after allocation→register
        const skipRemap = step !== "remap" && s.id === "remap" && idx > 3;
        return (
          <li
            key={s.id}
            className={cn(
              "border-2 px-2 py-1 font-display text-micro uppercase",
              active && "border-accent bg-accent text-fg",
              done && !active && "border-accent text-accent",
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
    <div className="flex flex-col gap-3 border-2 border-border bg-bg p-4">
      <p className="font-display text-micro uppercase text-muted">How distribution works</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 font-sans text-lg text-fg">
        <li>
          <strong className="text-accent">{formatCompactTokens(DISTRIBUTION.liquidity)}</strong> VENT
          liquidity
        </li>
        <li>
          <strong className="text-accent">{formatCompactTokens(DISTRIBUTION.community)}</strong> VENT
          community airdrop
        </li>
        <li>
          <strong className="text-accent">{formatCompactTokens(DISTRIBUTION.nft)}</strong> VENT NFT
          holders
        </li>
        <li>No team share</li>
      </ul>
      <p className="font-sans text-base text-muted">
        Token CA:{" "}
        <a
          href={VENT.explorerTokenUrl}
          target="_blank"
          rel="noreferrer"
          className="break-all text-accent underline underline-offset-4"
        >
          {VENT.address}
        </a>{" "}
        on {VENT.chainName}. Official NFT:{" "}
        <a
          href={OPENSEA_URL || VENTRAN_OPENSEA_URL}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-4"
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
      <p className="font-sans text-lg text-muted">
        Community eligibility list not yet published. Check back when proofs go live
        {demo ? "." : " — or try ?demo=1 to preview the flow."}
      </p>
    );
  }
  if (c.status === "eligible") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-accent">Eligible</p>
        <p className="font-display text-pixel-lg text-fg">
          {formatVentExact(c.amountWei)} <span className="text-accent">VENT</span>
        </p>
        {c.note ? <p className="font-sans text-base text-muted">{c.note}</p> : null}
      </div>
    );
  }
  if (c.status === "not-eligible") {
    return <p className="font-sans text-lg text-fg">Not eligible for the community pool.</p>;
  }
  return <p className="font-sans text-lg text-danger">{c.message}</p>;
}

function NftStatus({ n }: { n: NftLookup }) {
  if (n.status === "eligible") {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-display text-micro uppercase text-accent">Eligible</p>
        <p className="font-sans text-lg text-fg">{nftAmountCopy(n.tokenCount)}</p>
      </div>
    );
  }
  if (n.status === "not-eligible") {
    return <p className="font-sans text-lg text-fg">Not eligible for the NFT pool.</p>;
  }
  return <p className="font-sans text-lg text-danger">{n.message}</p>;
}

function hasInjectedProvider(): boolean {
  return typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
}

export function ClaimWizard({ demo = false }: { demo?: boolean }) {
  const mounted = useMounted();
  const now = useNow();
  const { address, isConnected, chainId, connector } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  const [step, setStep] = useState<WizardStep>("wallet");
  const [pasted, setPasted] = useState("");
  const [eligibleWallet, setEligibleWallet] = useState<Address | null>(null);
  const [compromised, setCompromised] = useState<boolean | null>(null);
  const [remapInput, setRemapInput] = useState("");
  const [remapError, setRemapError] = useState<string | null>(null);
  const [destinationWallet, setDestinationWallet] = useState<Address | null>(null);
  const [demoTxHash, setDemoTxHash] = useState<Hash | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

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
    enabled: Boolean(eligibleWallet) && (step === "eligibility" || step === "allocation" || step === "remap" || step === "register" || step === "done"),
    staleTime: 5 * 60_000,
  });

  const result = eligibilityQuery.data as CombinedEligibility | undefined;

  // Restore remap from localStorage when eligible wallet is set
  useEffect(() => {
    if (!eligibleWallet) return;
    const existing = loadRemap(eligibleWallet);
    if (existing) {
      setDestinationWallet(existing.destination as Address);
      setCompromised(true);
    }
  }, [eligibleWallet]);

  const registerAs = destinationWallet ?? eligibleWallet;

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(write.data) },
  });

  useEffect(() => {
    if (receipt.data?.status === "success") {
      setStep("done");
    }
  }, [receipt.data?.status]);

  const goCheck = useCallback(
    (wallet: Address) => {
      setEligibleWallet(wallet);
      setStep("eligibility");
      setCompromised(null);
      setDemoTxHash(null);
      setRegisterError(null);
    },
    [],
  );

  function onUseConnected() {
    if (!address) return;
    goCheck(address.toLowerCase() as Address);
  }

  function onPasteCheck() {
    const parsed = parseListedAddress(pasted);
    if (!parsed) {
      setRemapError(null);
      return;
    }
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

  function onSaveRemap() {
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
    saveRemap(eligibleWallet, parsed);
    setDestinationWallet(parsed);
    setRemapError(null);
    setStep("register");
  }

  function onPayRegister() {
    setRegisterError(null);
    if (!REGISTRATION.walletSet) {
      setRegisterError("Registration wallet not set yet — waiting on team.");
      return;
    }
    if (!isConnected || !address) {
      setRegisterError("Connect the wallet that will be written on-chain.");
      return;
    }
    if (registerAs && address.toLowerCase() !== registerAs.toLowerCase()) {
      setRegisterError(
        `Connect ${shortAddress(registerAs)} — that is the wallet that will be registered.`,
      );
      return;
    }
    if (chainId !== TARGET_CHAIN.id) {
      switchChain.mutate({ chainId: TARGET_CHAIN.id });
      return;
    }
    // Direct ARB ERC-20 transfer — never approve unlimited VENT.
    write.mutate({
      address: ARB_TOKEN.address,
      abi: ARB_ERC20_ABI,
      functionName: "transfer",
      args: [REGISTRATION.wallet, registrationFeeWei()],
      chainId: TARGET_CHAIN.id,
    });
  }

  function onDemoRegister() {
    // Simulated success for demos when registration wallet is not set.
    const fake = ("0x" + "ab".repeat(32)) as Hash;
    setDemoTxHash(fake);
    setStep("done");
  }

  // Auto-advance eligibility → allocation once loaded
  useEffect(() => {
    if (step === "eligibility" && eligibilityQuery.isSuccess && result) {
      setStep("allocation");
    }
  }, [step, eligibilityQuery.isSuccess, result]);

  const wrongNetwork = isConnected && chainId !== TARGET_CHAIN.id;
  const feeLabel = registrationFeeLabel();

  return (
    <div className="flex flex-col gap-6">
      <StepRail step={step} />

      {step === "wallet" ? (
        <Frame title="ELIGIBILITY WALLET" n="01">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-lg text-muted">
              Enter or connect the wallet used for eligibility (waitlist / NFT holder). Checking is
              free and never asks for a signature.
            </p>

            {mounted && isConnected && address ? (
              <div className="flex flex-col gap-3 border-2 border-border bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Wallet className="size-5 text-accent" />
                    <div>
                      <p className="font-display text-pixel text-fg">{shortAddress(address)}</p>
                      <p className="font-sans text-base text-muted">
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
                <p className="font-display text-micro uppercase text-muted">Connect</p>
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
                  <p className="font-sans text-base text-danger">
                    {isUserRejection(connect.error)
                      ? "Request rejected in wallet."
                      : "Couldn't connect. Unlock your wallet and try again."}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="font-sans text-lg text-muted">Loading wallet…</p>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-display text-micro uppercase text-muted">Or paste an address</p>
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
        <Frame title="CHECKING ELIGIBILITY" n="02">
          <div className="flex flex-col gap-4">
            <p className="font-sans text-lg text-muted">
              Looking up{" "}
              <span className="font-display text-pixel text-fg">
                {eligibleWallet ? shortAddress(eligibleWallet) : "…"}
              </span>{" "}
              against community + NFT lists…
            </p>
            {eligibilityQuery.isPending || eligibilityQuery.isFetching ? (
              <p className="flex items-center gap-2 font-sans text-lg text-muted">
                <Loader2 className="size-4 animate-spin" /> Checking…
              </p>
            ) : eligibilityQuery.isError ? (
              <div className="flex flex-col gap-3">
                <p className="font-sans text-lg text-danger">Couldn&apos;t load eligibility.</p>
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
        <Frame title="YOUR ALLOCATION" n="03">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-lg text-muted">
              Results for{" "}
              <span className="font-display text-pixel text-fg">
                {shortAddress(result.address)}
              </span>
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border-2 border-border bg-bg p-4">
                <p className="mb-2 font-display text-micro uppercase text-muted">
                  Community · {formatCompactTokens(DISTRIBUTION.community)} VENT
                </p>
                <CommunityStatus c={result.community} demo={demo} />
              </div>
              <div className="border-2 border-border bg-bg p-4">
                <p className="mb-2 font-display text-micro uppercase text-muted">
                  NFT holders · {formatCompactTokens(DISTRIBUTION.nft)} VENT
                </p>
                <NftStatus n={result.nft} />
              </div>
            </div>

            <DistributionBlurb />

            <div className="flex flex-col gap-3 border-2 border-accent bg-bg p-4">
              <p className="font-display text-micro uppercase text-accent">
                Is this eligibility wallet compromised?
              </p>
              <p className="font-sans text-base text-muted">
                If the wallet is unsafe, you can remap once to a new destination wallet. Remap is
                one-time — we never ask for unlimited approvals.
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
        <Frame title="REMAP DESTINATION" n="04">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 border-2 border-danger bg-bg p-4">
              <ShieldAlert className="mt-1 size-5 shrink-0 text-danger" />
              <div className="flex flex-col gap-2">
                <p className="font-display text-micro uppercase text-danger">One-time remap</p>
                <p className="font-sans text-lg text-fg">
                  Submit a <strong>new</strong> destination wallet. This mapping is stored
                  locally for now and prepared for on-chain register of the new wallet. You will
                  connect and pay the registration fee from that new wallet.
                </p>
                <p className="font-sans text-base text-muted">
                  Eligible wallet:{" "}
                  <span className="text-fg">
                    {eligibleWallet ? shortAddress(eligibleWallet) : "—"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-display text-micro uppercase text-muted" htmlFor="remap-addr">
                New destination wallet
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
              {remapError ? <p className="font-sans text-base text-danger">{remapError}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setStep("allocation")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={onSaveRemap}>Save remap &amp; continue</Button>
            </div>
          </div>
        </Frame>
      ) : null}

      {step === "register" ? (
        <Frame title="REGISTER" n="05">
          <div className="flex flex-col gap-5">
            <div className="border-2 border-accent bg-bg p-4">
              <p className="mb-2 font-display text-micro uppercase text-accent">
                Registration fee: ${REGISTRATION.feeUsd} in ARB
              </p>
              <p className="font-sans text-lg text-fg">
                Pay <strong>{feeLabel}</strong> on {VENT.chainName}. Fee is in the{" "}
                <strong>ARB ERC-20</strong> token (
                <a
                  href={ARB_TOKEN.explorerTokenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-4"
                >
                  {shortAddress(ARB_TOKEN.address)}
                </a>
                ), not ETH. Direct transfer only — no unlimited approvals, no VENT approval.
              </p>
            </div>

            <dl className="grid gap-3 font-sans text-base">
              <div>
                <dt className="font-display text-micro uppercase text-muted">Eligible wallet</dt>
                <dd className="text-fg">
                  {eligibleWallet ? shortAddress(eligibleWallet) : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-display text-micro uppercase text-muted">
                  Wallet written on-chain
                </dt>
                <dd className="text-fg">
                  {registerAs ? shortAddress(registerAs) : "—"}
                  {destinationWallet ? " (remapped)" : ""}
                </dd>
              </div>
              <div>
                <dt className="font-display text-micro uppercase text-muted">Registration wallet</dt>
                <dd className="break-all text-fg">
                  {REGISTRATION.walletSet ? (
                    REGISTRATION.wallet
                  ) : (
                    <span className="text-danger">
                      Not set yet — waiting on team (placeholder {shortAddress(REGISTRATION.wallet)})
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {mounted && isConnected && address ? (
              <div className="border-2 border-border bg-bg p-4">
                <p className="font-sans text-lg text-fg">
                  Connected: <span className="font-display text-pixel">{shortAddress(address)}</span>
                  {registerAs && address.toLowerCase() !== registerAs.toLowerCase() ? (
                    <span className="mt-2 block text-danger">
                      Switch to {shortAddress(registerAs)} to register.
                    </span>
                  ) : (
                    <span className="mt-2 block text-muted">Ready to pay the registration fee.</span>
                  )}
                </p>
                <Button variant="ghost" className="mt-2" onClick={() => disconnect.mutate()}>
                  Disconnect
                </Button>
              </div>
            ) : mounted ? (
              <div className="flex flex-col gap-3">
                <p className="font-sans text-lg text-muted">
                  Connect the wallet that will be written on-chain
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
                  !REGISTRATION.walletSet ||
                  write.isPending ||
                  receipt.isLoading ||
                  !isConnected
                }
                onClick={onPayRegister}
              >
                {!REGISTRATION.walletSet
                  ? "Registration wallet not set yet"
                  : write.isPending
                    ? "Confirm in wallet…"
                    : receipt.isLoading
                      ? "Confirming…"
                      : `Pay $${REGISTRATION.feeUsd} in ARB`}
              </Button>
              {demo && !REGISTRATION.walletSet ? (
                <Button variant="secondary" onClick={onDemoRegister}>
                  Demo: simulate register
                </Button>
              ) : null}
            </div>

            {registerError ? (
              <p className="flex items-start gap-2 font-sans text-base text-danger">
                <AlertTriangle className="mt-1 size-4 shrink-0" /> {registerError}
              </p>
            ) : null}
            {write.error ? (
              <p className="font-sans text-base text-danger">
                {isUserRejection(write.error)
                  ? "Transaction rejected in wallet."
                  : "Transfer failed. You need ARB token balance plus a little ETH for gas."}
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
          </div>
        </Frame>
      ) : null}

      {step === "done" ? (
        <Frame title="REGISTERED · CLAIM SOON" n="06">
          <div className="flex flex-col gap-5">
            <p className="flex items-center gap-2 font-display text-pixel text-accent">
              <CheckCircle2 className="size-5" /> Registration recorded
            </p>
            <p className="font-sans text-lg text-muted">
              Claims open {formatOpensAt(COMMUNITY_OPENS_AT)}. The claim button stays disabled until
              then — registration is the gate for now.
            </p>
            {(write.data || demoTxHash) && (
              <p className="font-sans text-base text-muted">
                Tx:{" "}
                {write.data ? (
                  <a
                    href={VENT.explorerTxUrl(write.data)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    {shortAddress(write.data)}
                  </a>
                ) : (
                  <span className="text-fg">{demoTxHash} (demo)</span>
                )}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <p className="font-display text-micro uppercase text-muted">Countdown to claim</p>
              <ClaimCountdown target={COMMUNITY_OPENS_AT} now={now} />
            </div>
            <Button disabled>Claim opens {formatOpensAt(COMMUNITY_OPENS_AT)}</Button>
            <SafetyLine />
            <p className="font-sans text-base text-muted">
              Official domain only: <strong className="text-accent">{CLAIM_DOMAIN}</strong>. Never
              share your seed phrase.
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
