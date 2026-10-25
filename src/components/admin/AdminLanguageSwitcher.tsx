import { useAdminI18n } from "@/lib/admin-i18n";

export function AdminLanguageSwitcher() {
  const { locale, setLocale, t } = useAdminI18n();
  return (
    <div
      role="group"
      aria-label={t("Язык интерфейса")}
      className="inline-flex shrink-0 items-center gap-1 text-xs"
    >
      <button
        type="button"
        onClick={() => setLocale("kg")}
        aria-pressed={locale === "kg"}
        className="min-h-10 px-2 text-muted-foreground aria-pressed:text-foreground"
      >
        KG
      </button>
      <span aria-hidden="true" className="text-muted-foreground">
        |
      </span>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        aria-pressed={locale === "ru"}
        className="min-h-10 px-2 text-muted-foreground aria-pressed:text-foreground"
      >
        RU
      </button>
    </div>
  );
}
