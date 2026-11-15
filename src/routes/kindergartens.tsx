import { createFileRoute } from "@tanstack/react-router";
import { KindergartensList } from "@/components/site/Kindergartens";
import { getPublishedKindergartens } from "@/lib/kindergartens-data";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/kindergartens")({
  loader: () => getPublishedKindergartens(),
  head: () => pageHead("Бала бакчалар", "Кара-Кулжа районундагы бала бакчалар жөнүндө маалымат."),
  component: KindergartensCatalogPage,
});

function KindergartensCatalogPage() {
  return <KindergartensList initialData={Route.useLoaderData()} />;
}
