import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { NewsList } from "@/components/admin/NewsList";
export const Route = createFileRoute("/admin_/news")({
  head: () => ({ meta: [{ title: "Новости - Kara-Kulja Admin" }] }),
  component: () => (
    <AdminGuard>
      <NewsList />
    </AdminGuard>
  ),
});
