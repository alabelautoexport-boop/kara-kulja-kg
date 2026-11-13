import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { SchoolWorkspace } from "@/components/admin/SchoolWorkspace";
export const Route = createFileRoute("/admin_/schools")({
  head: () => ({
    meta: [
      { title: "Управление школами - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SchoolManagement,
});
function SchoolManagement() {
  return (
    <AdminGuard>
      <SchoolWorkspace admin />
    </AdminGuard>
  );
}
