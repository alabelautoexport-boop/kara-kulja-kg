import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { KindergartenManagement } from "@/components/admin/KindergartenManagement";
export const Route = createFileRoute("/admin_/kindergartens")({
  head: () => ({
    meta: [
      { title: "Управление детскими садами - Kara-Kulja" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <KindergartenManagement />
    </AdminGuard>
  ),
});
