import { createFileRoute } from "@tanstack/react-router";
import { SchoolPublicPage } from "@/components/site/Schools";
export const Route = createFileRoute("/schools_/$slug")({ component: SchoolPage });
function SchoolPage() {
  return <SchoolPublicPage slug={Route.useParams().slug} />;
}
