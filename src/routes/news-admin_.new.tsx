import { createFileRoute } from "@tanstack/react-router";
import { EditorAreaGuard } from "@/components/admin/EditorAreaGuard";
import { NewsEditorNew } from "@/components/admin/NewsEditorPages";
export const Route = createFileRoute("/news-admin_/new")({
  head: () => ({
    meta: [
      { title: "Добавить новость - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <EditorAreaGuard area="news">
      <NewsEditorNew />
    </EditorAreaGuard>
  ),
});
