export type Profile = {
  ticket: string;
  handle: string;
  wallet: string;
  faceId: string | null;
  createdAt: number;
};

const PROFILE_KEY = "ventra.profile";
const NEXT_KEY = "ventra.nextTicket";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function formatTicket(n: number): string {
  return String(Math.max(1, Math.floor(n))).padStart(5, "0");
}

export function loadProfile(): Profile | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed || typeof parsed.ticket !== "string" || !parsed.handle || !parsed.wallet) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function nextTicketNumber(): number {
  if (!canUseStorage()) return 1;
  const raw = window.localStorage.getItem(NEXT_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function assignTicket(handle: string, wallet: string): Profile {
  const existing = loadProfile();
  if (existing) {
    const updated: Profile = { ...existing, handle, wallet };
    saveProfile(updated);
    return updated;
  }
  const n = nextTicketNumber();
  const profile: Profile = {
    ticket: formatTicket(n),
    handle,
    wallet,
    faceId: null,
    createdAt: Date.now(),
  };
  if (canUseStorage()) {
    window.localStorage.setItem(NEXT_KEY, String(n + 1));
  }
  saveProfile(profile);
  return profile;
}

export function setProfileFace(faceId: string): Profile | null {
  const existing = loadProfile();
  if (!existing) return null;
  const updated: Profile = { ...existing, faceId };
  saveProfile(updated);
  return updated;
}

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@+/, "").slice(0, 15);
}

export function isValidHandle(handle: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(handle);
}

export function normalizeWallet(input: string): string {
  return input.trim();
}

export function isValidWallet(wallet: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

export function shortWallet(wallet: string): string {
  if (wallet.length < 12) return wallet;
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}
