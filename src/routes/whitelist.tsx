import { createFileRoute } from "@tanstack/react-router";
import { VentraApp } from "@/components/ventra-app";

/** The Ventra NFT whitelist page, moved here unchanged from `/`. */
export const Route = createFileRoute("/whitelist")({
  head: () => ({
    meta: [
      { title: "Ventra NFT whitelist" },
      {
        name: "description",
        content:
          "Ventra NFT whitelist. 10,000 pixel faces minting on OpenSea. Get a ticket, pick a face, post the card. Mint September 25, 2026.",
      },
    ],
  }),
  component: Whitelist,
});

function Whitelist() {
  return <VentraApp />;
}
