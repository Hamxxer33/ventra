import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignTicket,
  isValidEmail,
  isValidHandle,
  normalizeHandle,
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
  const [email, setEmail] = useState(profile?.email ?? "");
  const [error, setError] = useState<string | null>(null);

  if (profile) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-display text-pixel text-accent">TICKET ASSIGNED</p>
        <p className="font-display text-pixel-xl text-fg">#{profile.ticket}</p>
        <p className="font-sans text-lg text-muted">
          @{profile.handle}
          <span className="mx-2 text-border">/</span>
          {profile.email}
        </p>
        <p className="font-sans text-base text-muted">
          Saved on this device. Pick a face to bake your card.
        </p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const h = normalizeHandle(handle);
    const em = email.trim();
    if (!isValidHandle(h)) {
      setError("X handle: 1–15 letters, numbers, or underscore.");
      return;
    }
    if (!isValidEmail(em)) {
      setError("Enter a valid email.");
      return;
    }
    setError(null);
    onAssigned(assignTicket(h, em));
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
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error ? (
        <p className="font-sans text-base text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto">
        Get ticket
      </Button>
    </form>
  );
}
