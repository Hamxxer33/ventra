import { useMemo } from "react";
import { AlertTriangle, LogOut, Wallet } from "lucide-react";
import { useConnect, useConnection, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { VENT, isUserRejection, shortAddress } from "@/lib/airdrop";
import { TARGET_CHAIN } from "@/lib/wagmi";
import { useMounted } from "@/components/claim/use-mounted";

function hasInjectedProvider(): boolean {
  return typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
}

function WalletDeepLinks() {
  const here = typeof window !== "undefined" ? window.location.href : "";
  const hostPath = here.replace(/^https?:\/\//, "");
  const links = [
    { label: "Open in MetaMask", href: `https://metamask.app.link/dapp/${hostPath}` },
    {
      label: "Open in Coinbase Wallet",
      href: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(here)}`,
    },
    {
      label: "Open in Trust Wallet",
      href: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(here)}`,
    },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-lg text-muted">
        No wallet found in this browser. On mobile, open this page inside your wallet app&apos;s
        browser. On desktop, install a browser wallet (MetaMask, Rabby, Coinbase Wallet).
      </p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <Button key={l.label} asChild variant="secondary">
            <a href={l.href} rel="noreferrer">
              {l.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function WalletPanel() {
  const mounted = useMounted();
  const { address, isConnected, chainId, connector } = useConnection();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  const injectedAvailable = mounted && hasInjectedProvider();
  const visible = useMemo(() => {
    const named = connectors.filter((c) => c.type === "injected" && c.id !== "injected");
    const mocks = connectors.filter((c) => c.type === "mock");
    const generic = connectors.filter((c) => c.id === "injected");
    const list = [...named, ...mocks];
    if (named.length === 0 && injectedAvailable) list.unshift(...generic);
    return list;
  }, [connectors, injectedAvailable]);

  if (!mounted) {
    return <p className="font-sans text-lg text-muted">Loading wallet…</p>;
  }

  if (isConnected && address) {
    const wrongNetwork = chainId !== TARGET_CHAIN.id;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-accent" />
            <div>
              <p className="font-display text-pixel text-fg">{shortAddress(address)}</p>
              <p className="font-sans text-base text-muted">
                {connector?.type === "mock" ? "Demo wallet (mock)" : (connector?.name ?? "Wallet")}{" "}
                · {wrongNetwork ? "wrong network" : VENT.chainName}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => disconnect.mutate()}>
            <LogOut className="size-4" />
            Disconnect
          </Button>
        </div>
        {wrongNetwork ? (
          <div className="flex flex-col gap-3 border-2 border-danger bg-bg p-4">
            <p className="flex items-center gap-2 font-display text-micro uppercase text-danger sm:text-pixel">
              <AlertTriangle className="size-4" /> Wrong network
            </p>
            <p className="font-sans text-lg text-fg">
              VENT lives on {VENT.chainName} (chain {VENT.chainId}). Switch networks to claim.
            </p>
            <Button
              className="w-fit"
              disabled={switchChain.isPending}
              onClick={() => switchChain.mutate({ chainId: TARGET_CHAIN.id })}
            >
              {switchChain.isPending ? "Check wallet…" : `Switch to ${VENT.chainName}`}
            </Button>
            {switchChain.error ? (
              <p className="font-sans text-base text-danger">
                Couldn&apos;t switch automatically. Pick {VENT.chainName} in your wallet.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-sans text-lg text-muted">
        Connect the wallet you signed up with to check both pools. Checking is free and never asks
        for a signature.
      </p>
      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {visible.map((c) => (
            <Button
              key={c.uid}
              variant={c.type === "mock" ? "secondary" : "primary"}
              disabled={connect.isPending}
              onClick={() => connect.mutate({ connector: c, chainId: TARGET_CHAIN.id })}
            >
              {c.icon ? (
                <img src={c.icon} alt="" className="size-4" />
              ) : (
                <Wallet className="size-4" />
              )}
              {c.type === "mock" ? "Demo wallet" : c.id === "injected" ? "Connect wallet" : c.name}
            </Button>
          ))}
        </div>
      ) : (
        <WalletDeepLinks />
      )}
      {connect.error ? (
        <p className="font-sans text-base text-danger">
          {isUserRejection(connect.error)
            ? "Request rejected in wallet."
            : "Couldn't connect. Unlock your wallet and try again."}
        </p>
      ) : null}
    </div>
  );
}
