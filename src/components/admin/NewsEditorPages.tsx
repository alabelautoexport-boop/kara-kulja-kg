import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewsForm } from "@/components/admin/NewsForm";
import { adminGetNewsById } from "@/lib/news-data";
import { useAdminI18n } from "@/lib/admin-i18n";

export function NewsEditorNew() {
  const { t } = useAdminI18n();
  return (
    <AdminShell area="news" title={t("Добавить новость")} backTo="/news-admin">
      <NewsForm editor />
    </AdminShell>
  );
}
export function NewsEditorEdit({ id }: { id: string }) {
  const { t } = useAdminI18n();
  const query = useQuery({
    queryKey: ["admin-news", id],
    queryFn: () => adminGetNewsById(id),
    retry: false,
  });
  return (
    <AdminShell area="news" title={t("Редактировать новость")} backTo="/news-admin">
      {query.isLoading ? (
        <p>{t("Загрузка...")}</p>
      ) : query.error ? (
        <p role="alert">{t("Не удалось загрузить новость.")}</p>
      ) : query.data ? (
        <NewsForm editor initial={query.data} />
      ) : (
        <p>{t("Новость не найдена.")}</p>
      )}
    </AdminShell>
  );
}
