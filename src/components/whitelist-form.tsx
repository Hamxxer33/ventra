import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { TelegramLogo, XLogo } from "@/components/pixel-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TELEGRAM_URL, X_URL } from "@/lib/drop";
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
import { cn } from "@/lib/utils";

const FOLLOWED_KEY = "ventra.followedX";
const JOINED_KEY = "ventra.joinedTg";

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

function TaskButton({
  href,
  done,
  onOpen,
  icon,
  idle,
  complete,
}: {
  href: string;
  done: boolean;
  onOpen: () => void;
  icon: ReactNode;
  idle: string;
  complete: string;
}) {
  return (
    <Button asChild variant={done ? "primary" : "secondary"} className="w-full justify-start sm:w-auto">
      <a href={href} target="_blank" rel="noreferrer" onClick={onOpen}>
        {icon}
        {done ? complete : idle}
      </a>
    </Button>
  );
}

export function WhitelistForm({
  profile,
  onAssigned,
}: {
  profile: Profile | null;
  onAssigned: (profile: Profile) => void;
}) {
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [wallet, setWallet] = useState(profile?.wallet ?? "");
  const [followed, setFollowed] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFollowed(readFlag(FOLLOWED_KEY));
    setJoined(readFlag(JOINED_KEY));
  }, []);

  const tasksDone = followed && joined;

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

  function markFollowed() {
    writeFlag(FOLLOWED_KEY);
    setFollowed(true);
  }

  function markJoined() {
    writeFlag(JOINED_KEY);
    setJoined(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!followed || !joined) {
      setError("Follow @Ventranxyz and join Telegram first.");
      return;
    }
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
      <div className="flex flex-col gap-3">
        <p className="font-display text-pixel text-muted">Do this first</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <TaskButton
            href={X_URL}
            done={followed}
            onOpen={markFollowed}
            icon={<XLogo />}
            idle="Follow @Ventranxyz"
            complete="Followed @Ventranxyz"
          />
          <TaskButton
            href={TELEGRAM_URL}
            done={joined}
            onOpen={markJoined}
            icon={<TelegramLogo />}
            idle="Join Telegram"
            complete="Joined Telegram"
          />
        </div>
        <p className={cn("font-sans text-base", tasksDone ? "text-accent" : "text-muted")}>
          {tasksDone
            ? "Tasks done. Drop your handle and wallet."
            : "Wallet stays locked until both are done."}
        </p>
      </div>
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
            disabled={busy || !tasksDone}
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
          disabled={busy || !tasksDone}
        />
      </div>
      {error ? (
        <p className="font-sans text-base text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={busy || !tasksDone}>
        {busy ? "Sending" : "Get ticket"}
      </Button>
    </form>
  );
}
