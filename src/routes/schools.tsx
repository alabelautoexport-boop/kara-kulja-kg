import { createFileRoute } from "@tanstack/react-router";
import { SchoolsList } from "@/components/site/Schools";
export const Route = createFileRoute("/schools")({
  head: () => ({ meta: [{ title: "Орто мектептер - Kara-Kulja" }] }),
  component: SchoolsList,
});
