import { createFileRoute } from "@tanstack/react-router";
import { EditorAreaGuard } from "@/components/admin/EditorAreaGuard";
import { NewsEditorEdit } from "@/components/admin/NewsEditorPages";
export const Route = createFileRoute("/news-admin_/$id/edit")({
  head: () => ({
    meta: [
      { title: "Редактировать новость - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return (
    <EditorAreaGuard area="news">
      <NewsEditorEdit id={id} />
    </EditorAreaGuard>
  );
}
