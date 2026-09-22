/** Ventra mint: 25 September 2026, 12:00 UTC. */
export const MINT_AT_MS = Date.UTC(2026, 8, 25, 12, 0, 0);

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  done: boolean;
};

export function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function getCountdown(now = Date.now()): Countdown {
  const diff = Math.max(0, MINT_AT_MS - now);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    done: totalSeconds === 0,
  };
}

export function formatCountdownLine(c: Countdown): string {
  if (c.done) return "MINT LIVE";
  return `${pad2(c.days)}D ${pad2(c.hours)}H ${pad2(c.minutes)}M ${pad2(c.seconds)}S`;
}
