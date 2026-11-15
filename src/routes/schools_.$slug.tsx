import { createFileRoute, notFound } from "@tanstack/react-router";
import { SchoolPublicPage } from "@/components/site/Schools";
import { getPublishedSchool } from "@/lib/schools-data";
import { institutionDescription, pageHead } from "@/lib/seo";
export const Route = createFileRoute("/schools_/$slug")({
  loader: async ({ params }) => {
    const school = await getPublishedSchool(params.slug);
    if (!school) throw notFound();
    return school;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead(
          loaderData.document.info.name_kg,
          institutionDescription(loaderData.document.info, loaderData.document.info.name_kg),
        )
      : {},
  component: SchoolPage,
});
function SchoolPage() {
  return <SchoolPublicPage slug={Route.useParams().slug} initialData={Route.useLoaderData()} />;
}
