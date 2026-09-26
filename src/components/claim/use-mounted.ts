import { useEffect, useState } from "react";

/** False during SSR + first client render; wallet state only exists in the browser. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
