import { useAdminI18n } from "@/lib/admin-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";

export const Route = createFileRoute("/admin_/news_/new")({
  head: () => ({ meta: [{ title: "Добавить новость - Kara-Kulja Admin" }] }),
  component: NewNewsPage,
});

function NewNewsPage() {
  const { t } = useAdminI18n();
  return (
    <AdminGuard>
      <AdminShell eyebrow={t("НОВОСТИ")} title={t("Добавить новость")} backTo="/admin/news">
        <NewsForm />
      </AdminShell>
    </AdminGuard>
  );
}
