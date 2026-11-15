import { createFileRoute, notFound } from "@tanstack/react-router";
import { KindergartenPublicPage } from "@/components/site/Kindergartens";
import { kindergartenDisplayName } from "@/components/site/kindergarten-display-name";
import { getPublishedKindergarten } from "@/lib/kindergartens-data";
import { institutionDescription, pageHead } from "@/lib/seo";
export const Route = createFileRoute("/kindergartens_/$slug")({
  loader: async ({ params }) => {
    const garden = await getPublishedKindergarten(params.slug);
    if (!garden) throw notFound();
    return garden;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const name = kindergartenDisplayName(loaderData.document.info, loaderData.slug, "kg");
    return pageHead(name, institutionDescription(loaderData.document.info, name));
  },
  component: KindergartenDetailRoute,
});

function KindergartenDetailRoute() {
  const { slug } = Route.useParams();
  return <KindergartenPublicPage slug={slug} initialData={Route.useLoaderData()} />;
}
