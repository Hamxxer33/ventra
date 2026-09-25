import { createFileRoute } from "@tanstack/react-router";
import { ClaimApp } from "@/components/claim/claim-app";

type ClaimSearch = { demo?: boolean };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): ClaimSearch => {
    const d = search.demo;
    return d === 1 || d === "1" || d === true || d === "true" ? { demo: true } : {};
  },
  component: Home,
});

function Home() {
  const { demo } = Route.useSearch();
  return <ClaimApp demo={Boolean(demo)} />;
}
