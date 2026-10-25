import { useAdminI18n } from "@/lib/admin-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";
import { adminGetNewsById } from "@/lib/news-data";

export const Route = createFileRoute("/admin_/news_/$id/edit")({
  head: () => ({ meta: [{ title: "Редактировать новость - Kara-Kulja Admin" }] }),
  component: EditNewsPage,
});

function EditNewsPage() {
  const { t } = useAdminI18n();
  const { id } = Route.useParams();
  const query = useQuery({
    queryKey: ["admin-news", id],
    queryFn: () => adminGetNewsById(id),
    retry: false,
  });

  return (
    <AdminGuard>
      <AdminShell eyebrow={t("НОВОСТИ")} title={t("Редактировать новость")} backTo="/admin/news">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Загрузка...")}</p>
        ) : query.error ? (
          <p className="text-sm text-destructive">{t("Не удалось загрузить новость.")}</p>
        ) : query.data ? (
          <NewsForm initial={query.data} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("Новость не найдена.")}</p>
        )}
      </AdminShell>
    </AdminGuard>
  );
}
