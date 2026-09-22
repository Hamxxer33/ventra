import { useEffect, useState } from "react";
import { getCountdown, type Countdown } from "@/lib/countdown";

export function useCountdown(): Countdown | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return null;
  return getCountdown(now);
}
