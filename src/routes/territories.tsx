import { createFileRoute } from "@tanstack/react-router";
import { TerritoriesLanding } from "@/components/site/TerritoriesLanding";

export const Route = createFileRoute("/territories")({
  component: TerritoriesLanding,
});
