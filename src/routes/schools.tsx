import { createFileRoute } from "@tanstack/react-router";
import { SchoolsList } from "@/components/site/Schools";
import { getPublishedSchools } from "@/lib/schools-data";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/schools")({
  loader: () => getPublishedSchools(),
  head: () => pageHead("Мектептер", "Кара-Кулжа районундагы мектептер жөнүндө маалымат."),
  component: SchoolsCatalogPage,
});

function SchoolsCatalogPage() {
  return <SchoolsList initialData={Route.useLoaderData()} />;
}
