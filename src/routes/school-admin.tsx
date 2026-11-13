import { createFileRoute } from "@tanstack/react-router";
import { SchoolWorkspace } from "@/components/admin/SchoolWorkspace";
import { EditorAreaGuard } from "@/components/admin/EditorAreaGuard";
export const Route = createFileRoute("/school-admin")({
  head: () => ({
    meta: [
      { title: "School editor - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <EditorAreaGuard area="school">
      <SchoolWorkspace />
    </EditorAreaGuard>
  ),
});
