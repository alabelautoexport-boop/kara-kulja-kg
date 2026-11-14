import { createFileRoute } from "@tanstack/react-router";
import { KindergartenPublicPage } from "@/components/site/Kindergartens";
export const Route = createFileRoute("/kindergartens_/$slug")({
  component: KindergartenDetailRoute,
});

function KindergartenDetailRoute() {
  const { slug } = Route.useParams();
  return <KindergartenPublicPage slug={slug} />;
}
