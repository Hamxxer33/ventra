import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { BellLogo, RepostLogo, TelegramLogo, XLogo } from "@/components/pixel-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TELEGRAM_URL, X_POST_URL, X_URL } from "@/lib/drop";
import { submitWhitelistToGoogleForm } from "@/lib/gform";
import { claimTicket } from "@/lib/ticket-claim";
import { issueTicket } from "@/lib/ticket-ledger";
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
const NOTIFY_KEY = "ventra.notifyX";
const REPOST_KEY = "ventra.repostedDrop2";
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

function TaskRow({
  n,
  href,
  done,
  onOpen,
  icon,
  label,
  doneLabel,
}: {
  n: string;
  href: string;
  done: boolean;
  onOpen: () => void;
  icon: ReactNode;
  label: string;
  doneLabel: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 border-2 px-3 py-2",
        done ? "border-accent bg-accent-dim/40" : "border-border bg-surface-2",
      )}
    >
      <span
        className={cn(
          "w-8 shrink-0 font-display text-micro",
          done ? "text-accent" : "text-muted",
        )}
      >
        {done ? "OK" : n}
      </span>
      <span className={cn("shrink-0", done ? "text-accent" : "text-fg")}>{icon}</span>
      <p className={cn("min-w-0 flex-1 font-sans text-lg leading-tight", done ? "text-fg" : "text-muted")}>
        {done ? doneLabel : label}
      </p>
      <Button
        asChild
        variant={done ? "primary" : "secondary"}
        className={cn("shrink-0 px-3", done && "text-bg")}
      >
        <a href={href} target="_blank" rel="noreferrer" onClick={onOpen}>
          {done ? "Done" : "Open"}
        </a>
      </Button>
    </div>
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
  const [notified, setNotified] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFollowed(readFlag(FOLLOWED_KEY));
    setNotified(readFlag(NOTIFY_KEY));
    setReposted(readFlag(REPOST_KEY));
    setJoined(readFlag(JOINED_KEY));
  }, []);

  const doneCount = [followed, notified, reposted, joined].filter(Boolean).length;
  const tasksDone = doneCount === 4;

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
          Global ticket. Same handle always gets the same number. Pick a face to bake your card.
        </p>
      </div>
    );
  }

  function markFollowed() {
    writeFlag(FOLLOWED_KEY);
    setFollowed(true);
  }

  function markNotified() {
    writeFlag(NOTIFY_KEY);
    setNotified(true);
  }

  function markReposted() {
    writeFlag(REPOST_KEY);
    setReposted(true);
  }

  function markJoined() {
    writeFlag(JOINED_KEY);
    setJoined(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!followed || !notified || !reposted || !joined) {
      setError("Finish all four tasks first.");
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
      const claimed = await issueTicket(h, () => claimTicket({ data: { handle: h } }));
      void submitWhitelistToGoogleForm(w, h);
      onAssigned(assignTicket(h, w, claimed.ticket));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-pixel text-muted">Do this first</p>
          <p className={cn("font-display text-micro", tasksDone ? "text-accent" : "text-muted")}>
            {doneCount}/4
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <TaskRow
            n="01"
            href={X_URL}
            done={followed}
            onOpen={markFollowed}
            icon={<XLogo />}
            label="Follow @Ventranxyz"
            doneLabel="Followed @Ventranxyz"
          />
          <TaskRow
            n="02"
            href={X_URL}
            done={notified}
            onOpen={markNotified}
            icon={<BellLogo />}
            label="Turn on notifications"
            doneLabel="Notifications on"
          />
          <TaskRow
            n="03"
            href={X_POST_URL}
            done={reposted}
            onOpen={markReposted}
            icon={<RepostLogo />}
            label="Repost the drop post"
            doneLabel="Reposted the drop post"
          />
          <TaskRow
            n="04"
            href={TELEGRAM_URL}
            done={joined}
            onOpen={markJoined}
            icon={<TelegramLogo />}
            label="Join Telegram"
            doneLabel="Joined Telegram"
          />
        </div>
        <p className={cn("font-sans text-base", tasksDone ? "text-accent" : "text-muted")}>
          {tasksDone
            ? "Tasks done. Drop your handle and wallet."
            : "Wallet stays locked until all four are done."}
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
