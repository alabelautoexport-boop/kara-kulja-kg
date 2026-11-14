import { createFileRoute } from "@tanstack/react-router";
import { KindergartensList } from "@/components/site/Kindergartens";
export const Route = createFileRoute("/kindergartens")({
  head: () => ({ meta: [{ title: "Бала бакчалар - Kara-Kulja" }] }),
  component: KindergartensList,
});
