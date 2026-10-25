import { formatAdminDate, useAdminI18n } from "@/lib/admin-i18n";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminGetAllNews, deleteNews, type NewsRecord } from "@/lib/news-data";

export const Route = createFileRoute("/admin_/news")({
  head: () => ({ meta: [{ title: "Новости - Kara-Kulja Admin" }] }),
  component: AdminNewsPage,
});

function AdminNewsPage() {
  const { t, locale } = useAdminI18n();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<NewsRecord | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const newsQuery = useQuery({ queryKey: ["admin-news"], queryFn: adminGetAllNews, retry: false });
  const deleteMutation = useMutation({
    mutationFn: (news: NewsRecord) => deleteNews(news),
    onSuccess: async () => {
      setMessage("Новость удалена.");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: async (newsItems: NewsRecord[]) => {
      const deleted: string[] = [];
      const failed: NewsRecord[] = [];
      for (const news of newsItems) {
        try {
          await deleteNews(news);
          deleted.push(news.id);
        } catch {
          failed.push(news);
        }
      }
      return { deleted, failed };
    },
    onSuccess: async ({ deleted, failed }) => {
      const failedTitles = failed.map((news) => news.title_kg).join(", ");
      setMessage(
        `Удалено: ${deleted.length}\nНе удалось удалить: ${failed.length}${
          failedTitles ? `\n${failedTitles}` : ""
        }`,
      );
      setSelectedIds(new Set(failed.map((news) => news.id)));
      setPendingBulkDelete(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      await queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const newsItems = newsQuery.data ?? [];
  const selectedNews = newsItems.filter((news) => selectedIds.has(news.id));
  const allSelected = newsItems.length > 0 && selectedNews.length === newsItems.length;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminGuard>
      <AdminShell
        eyebrow={t("НОВОСТИ")}
        title={t("Новости")}
        backTo="/admin"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={!selectedNews.length || bulkDeleteMutation.isPending}
              onClick={() => setPendingBulkDelete(true)}
              className="inline-flex min-h-10 items-center gap-2 border border-destructive/50 px-4 py-2 text-sm text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              {t("Удалить выбранные")}
            </button>
            <Link
              to="/admin/news/new"
              className="inline-flex min-h-10 items-center gap-2 bg-[var(--beige)] px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              {t("Добавить новость")}
            </Link>
          </div>
        }
      >
        {(message || deleteMutation.error || bulkDeleteMutation.error) && (
          <p className="mb-5 whitespace-pre-line border hairline px-4 py-3 text-sm">
            {t(
              deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : bulkDeleteMutation.error
                  ? "Некоторые новости не удалось удалить."
                  : message,
            )}
          </p>
        )}
        {newsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Загрузка...")}</p>
        ) : newsQuery.error ? (
          <p className="text-sm text-destructive">{t("Не удалось загрузить новости.")}</p>
        ) : (
          <div className="overflow-x-auto border-y hairline">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b hairline text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-12 px-4 py-4 font-medium">
                    <input
                      type="checkbox"
                      aria-label={t("Выбрать все новости")}
                      checked={allSelected}
                      onChange={(event) =>
                        setSelectedIds(
                          event.target.checked
                            ? new Set(newsItems.map((news) => news.id))
                            : new Set(),
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-4 font-medium">{t("Заголовок")}</th>
                  <th className="px-4 py-4 font-medium">{t("Статус")}</th>
                  <th className="px-4 py-4 font-medium">{t("Важная")}</th>
                  <th className="px-4 py-4 font-medium">{t("Публикация")}</th>
                  <th className="px-4 py-4 font-medium">{t("Обновлено")}</th>
                  <th className="px-4 py-4 font-medium">
                    <span className="sr-only">{t("Действия")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {newsItems.map((news) => (
                  <tr key={news.id}>
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        aria-label={`${t("Выбрать:")} ${news.title_kg}`}
                        checked={selectedIds.has(news.id)}
                        onChange={() => toggleSelected(news.id)}
                      />
                    </td>
                    <td className="max-w-xs px-4 py-5 font-medium">{news.title_kg}</td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {t(news.is_published ? "Опубликовано" : "Черновик")}
                    </td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {t(news.is_featured ? "Да" : "Нет")}
                    </td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {formatAdminDate(news.published_at, locale)}
                    </td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {formatAdminDate(news.updated_at, locale)}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/admin/news/$id/edit"
                          params={{ id: news.id }}
                          aria-label={t("Редактировать")}
                          title={t("Редактировать")}
                          className="flex h-9 w-9 items-center justify-center border hairline hover:text-[var(--beige)]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setPendingDelete(news)}
                          aria-label={t("Удалить")}
                          title={t("Удалить")}
                          className="flex h-9 w-9 items-center justify-center border hairline hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!newsQuery.data?.length && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t("Новостей пока нет.")}
              </p>
            )}
          </div>
        )}
      </AdminShell>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Удалить новость?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Сначала будут удалены все связанные фотографии из R2, затем запись новости. Если очистка хранилища не удастся, новость останется. Это действие нельзя отменить.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Отмена")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {t(deleteMutation.isPending ? "Удаление..." : "Удалить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingBulkDelete} onOpenChange={setPendingBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Удалить выбранные новости:")} {selectedNews.length}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Для каждой новости сначала будет очищена только её папка в R2. Запись удалится лишь после успешной очистки связанных файлов.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Отмена")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(selectedNews)}
              disabled={bulkDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {t(bulkDeleteMutation.isPending ? "Удаление..." : "Удалить выбранные")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminGuard>
  );
}
