import { createFileRoute } from "@tanstack/react-router";
import { TerritoriesLanding } from "@/components/site/TerritoriesLanding";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/territories")({
  head: () =>
    pageHead("Аймактар", "Кара-Кулжа районунун айыл аймактары жана айылдары жөнүндө маалымат."),
  component: TerritoriesLanding,
});
