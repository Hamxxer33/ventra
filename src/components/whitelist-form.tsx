import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitWhitelistToGoogleForm } from "@/lib/gform";
import {
  assignTicket,
  isValidHandle,
  isValidWallet,
  normalizeHandle,
  normalizeWallet,
  shortWallet,
  type Profile,
} from "@/lib/ticket";

export function WhitelistForm({
  profile,
  onAssigned,
}: {
  profile: Profile | null;
  onAssigned: (profile: Profile) => void;
}) {
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [wallet, setWallet] = useState(profile?.wallet ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (profile) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-display text-pixel text-accent">TICKET ASSIGNED</p>
        <p className="font-display text-pixel-xl text-fg">#{profile.ticket}</p>
        <p className="font-sans text-lg text-muted">
          @{profile.handle}
          <span className="mx-2 text-border">/</span>
          {shortWallet(profile.wallet)}
        </p>
        <p className="font-sans text-base text-muted">
          Saved on this device. Pick a face to bake your card.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const h = normalizeHandle(handle);
    const w = normalizeWallet(wallet);
    if (!isValidHandle(h)) {
      setError("X handle: 1–15 letters, numbers, or underscore.");
      return;
    }
    if (!isValidWallet(w)) {
      setError("Wallet: 0x plus 40 hex characters.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await submitWhitelistToGoogleForm(w, h);
      onAssigned(assignTicket(h, w));
    } catch {
      setError("Could not send your wallet. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="x-handle">X handle</Label>
        <div className="flex items-stretch">
          <span className="inline-flex h-11 items-center border-2 border-r-0 border-border bg-surface-2 px-3 font-display text-pixel text-muted">
            @
          </span>
          <Input
            id="x-handle"
            name="handle"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourhandle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="border-l-0"
            disabled={busy}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="wallet">Wallet</Label>
        <Input
          id="wallet"
          name="wallet"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="0x…"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          disabled={busy}
        />
      </div>
      {error ? (
        <p className="font-sans text-base text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
        {busy ? "Sending" : "Get ticket"}
      </Button>
    </form>
  );
}
