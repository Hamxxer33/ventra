import { createFileRoute } from "@tanstack/react-router";
import { VentraApp } from "@/components/ventra-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <VentraApp />;
}
