import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
// Side-effect: createAppKit runs at module top-level before children use useAppKit.
import { appkitWagmiConfig } from "@/lib/appkit";
import { makeWagmiConfig } from "@/lib/wagmi";

// Keep a live reference so bundlers with sideEffects:false cannot drop appkit init.
void appkitWagmiConfig;

export function ClaimProviders({ demo, children }: { demo: boolean; children: ReactNode }) {
  const [config] = useState(() => makeWagmiConfig({ demo }));
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
