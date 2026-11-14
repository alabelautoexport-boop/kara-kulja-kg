import { createFileRoute } from "@tanstack/react-router";
import { SchoolEditorWorkspace } from "@/components/admin/SchoolEditorWorkspace";
export const Route = createFileRoute("/school-admin")({
  head: () => ({
    meta: [
      { title: "School editor - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SchoolEditorWorkspace,
});
