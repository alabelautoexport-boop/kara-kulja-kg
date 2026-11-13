import { createFileRoute } from "@tanstack/react-router";
import { EditorAreaGuard } from "@/components/admin/EditorAreaGuard";
import { NewsList } from "@/components/admin/NewsList";
export const Route = createFileRoute("/news-admin")({
  head: () => ({
    meta: [{ title: "Новости - Kara-Kulja" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <EditorAreaGuard area="news">
      <NewsList editor />
    </EditorAreaGuard>
  ),
});
