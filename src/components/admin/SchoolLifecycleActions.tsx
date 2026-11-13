import { useState } from "react";
import { useAdminI18n } from "@/lib/admin-i18n";
import { archiveSchool, permanentlyDeleteSchool, type SchoolRecord } from "@/lib/schools-data";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function SchoolLifecycleActions({
  record,
  onChanged,
}: {
  record: SchoolRecord;
  onChanged: (deleted: boolean, message: string) => Promise<void>;
}) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const button =
    "min-h-11 border hairline px-4 py-2 text-sm disabled:opacity-50 hover:border-[var(--beige)]";
  const run = async (deleting: boolean) => {
    setBusy(true);
    setError("");
    try {
      if (deleting) await permanentlyDeleteSchool(record.id, record.revision, name);
      else await archiveSchool(record.id, record.revision, !record.is_archived);
      setOpen(false);
      await onChanged(
        deleting,
        deleting
          ? "Школа удалена"
          : record.is_archived
            ? "Школа восстановлена. Для публикации требуется проверка."
            : "Школа перемещена в архив",
      );
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Не удалось сохранить школу."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="my-8 border-t hairline pt-6">
      <h2 className="mb-5 font-display text-xl">{t("Управление")}</h2>
      {record.is_archived && (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("Школа в архиве. Сначала восстановите её.")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          className={button}
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                t(
                  record.is_archived
                    ? "Восстановить школу без публикации?"
                    : "Переместить школу в архив? Несохранённые изменения не сохранятся.",
                ),
              )
            )
              void run(false);
          }}
        >
          {t(record.is_archived ? "Восстановить" : "В архив")}
        </button>
        {record.is_archived && (
          <button
            className={`${button} text-destructive`}
            disabled={busy}
            onClick={() => {
              setName("");
              setError("");
              setOpen(true);
            }}
          >
            {t("Удалить навсегда")}
          </button>
        )}
      </div>
      {!open && error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <AlertDialogTitle>{t("Удалить навсегда")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Школа и все связанные с ней данные будут удалены без возможности восстановления.")}
          </AlertDialogDescription>
          <label className="min-w-0 text-sm">
            {t("Введите точное название школы")}:{" "}
            <span className="break-words">{record.name_kg}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              disabled={busy}
              className="mt-3 min-h-11 w-full border hairline bg-background px-3"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialogCancel disabled={busy}>{t("Отмена")}</AlertDialogCancel>
            <button
              className={`${button} text-destructive`}
              disabled={busy || name !== record.name_kg}
              onClick={() => void run(true)}
            >
              {t("Удалить навсегда")}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
