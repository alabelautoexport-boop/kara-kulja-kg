import { createFileRoute } from "@tanstack/react-router";
import { TerritoriesLanding } from "@/components/site/TerritoriesLanding";

export const Route = createFileRoute("/villages")({
  head: () => ({
    meta: [
      { title: "Villages — Kara-Kulja" },
      { name: "description", content: "Discover the villages of Kara-Kulja district." },
      { property: "og:title", content: "Villages of Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/villages" }],
  }),
  component: TerritoriesLanding,
});
