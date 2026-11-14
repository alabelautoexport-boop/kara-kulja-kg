import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAdminI18n } from "@/lib/admin-i18n";
import { optimizeSchoolImage } from "@/lib/school-image-optimizer";
import { uploadSchoolImage, previewSchoolImage } from "@/lib/school-media";
import type { SchoolMediaImage, SchoolMediaSelection } from "@/lib/school-media-model";
const button =
  "inline-flex min-h-11 items-center justify-center border hairline px-3 py-2 text-xs hover:border-[var(--beige)] disabled:opacity-50";
function Preview({
  schoolId,
  image,
  large = false,
}: {
  schoolId: string;
  image: SchoolMediaImage;
  large?: boolean;
}) {
  const { t } = useAdminI18n();
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setUrl("");
    setFailed(false);
    void previewSchoolImage(schoolId, image.asset_id, large ? "main" : "thumb")
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [schoolId, image.asset_id, large]);
  return url ? (
    <img
      src={url}
      alt={t("Фотография школы")}
      width={large ? image.width : image.thumb_width}
      height={large ? image.height : image.thumb_height}
      className={large ? "max-h-[75vh] w-full object-contain" : "aspect-[4/3] w-full object-cover"}
    />
  ) : (
    <p className="p-4 text-xs text-muted-foreground">
      {t(failed ? "Не удалось загрузить фотографию." : "Подготовка")}
    </p>
  );
}
export function SchoolMediaEditor({
  schoolId,
  value,
  onChange,
  onBusy,
  disabled = false,
}: {
  schoolId: string;
  value: SchoolMediaSelection | undefined;
  onChange: (media: SchoolMediaSelection) => void;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useAdminI18n();
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const uploading = useRef(false);
  const upload = async (files: FileList | null, kind: "cover" | "gallery") => {
    if (!files?.length || !value || disabled || uploading.current) return;
    if (kind === "gallery" && value.gallery.length + files.length > 15) {
      setError(t("В галерее школы может быть не более 15 фотографий."));
      return;
    }
    uploading.current = true;
    onBusy(true);
    setError("");
    const added: SchoolMediaImage[] = [];
    try {
      for (const file of Array.from(files)) {
        setStage("Подготовка");
        await new Promise((resolve) => setTimeout(resolve, 0));
        setStage("Оптимизация");
        const optimized = await optimizeSchoolImage(file, kind);
        setStage("Загрузка");
        added.push(await uploadSchoolImage(schoolId, kind, optimized.main, optimized.thumb));
      }
      onChange(
        kind === "cover"
          ? { ...value, cover: added[0] }
          : { ...value, gallery: [...value.gallery, ...added] },
      );
    } catch (e) {
      // Successfully uploaded new files remain private/unused until the whole selection saves.
      setError(t(e instanceof Error ? e.message : "Не удалось подготовить фотографию."));
    } finally {
      uploading.current = false;
      setStage("");
      onBusy(false);
    }
  };
  const move = (index: number, step: number) => {
    if (!value) return;
    const next = [...value.gallery];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...value, gallery: next });
  };
  return (
    <section className="border-t hairline py-8">
      <h2 className="mb-4 font-sans text-lg font-semibold tracking-normal">
        {t("Главное фото школы")}
      </h2>
      <p className="mb-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        {t(
          "Загружайте только фотографии, разрешённые для публикации. Не добавляйте ФИО учащихся, документы, телефоны или другие личные сведения.",
        )}
      </p>
      {!value ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("Медиа школы пока не настроены. Требуется локальная миграция и функция school-media.")}
        </p>
      ) : (
        <fieldset disabled={disabled || !!stage} className="min-w-0 space-y-5">
          {value.cover && (
            <div className="max-w-md">
              <Preview schoolId={schoolId} image={value.cover} />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <label className={`${button} cursor-pointer`}>
              {t(value.cover ? "Заменить" : "Загрузить")}
              <input
                aria-label={t("Загрузить главное фото")}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => {
                  void upload(e.target.files, "cover");
                  e.target.value = "";
                }}
              />
            </label>
            {value.cover && (
              <button
                type="button"
                className={button}
                onClick={() => onChange({ ...value, cover: null })}
              >
                {t("Удалить из черновика")}
              </button>
            )}
          </div>
          <h3 className="pt-3 font-sans text-lg font-semibold tracking-normal">
            {t("Школьная жизнь")}{" "}
            <span className="text-sm text-muted-foreground">{value.gallery.length}/15</span>
          </h3>
          <label className={`${button} cursor-pointer`}>
            {t("Добавить фотографии")}
            <input
              aria-label={t("Добавить фотографии")}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={value.gallery.length >= 15 || disabled || !!stage}
              className="sr-only"
              onChange={(e) => {
                void upload(e.target.files, "gallery");
                e.target.value = "";
              }}
            />
          </label>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {value.gallery.map((image, index) => (
              <div key={image.asset_id} className="min-w-0 border hairline p-2">
                <Preview schoolId={schoolId} image={image} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={button}
                    disabled={index === 0 || disabled || !!stage}
                    onClick={() => move(index, -1)}
                  >
                    {t("Раньше")}
                  </button>
                  <button
                    type="button"
                    className={button}
                    disabled={index === value.gallery.length - 1 || disabled || !!stage}
                    onClick={() => move(index, 1)}
                  >
                    {t("Позже")}
                  </button>
                  <button
                    type="button"
                    className={button}
                    onClick={() =>
                      onChange({
                        ...value,
                        gallery: value.gallery.filter((i) => i.asset_id !== image.asset_id),
                      })
                    }
                  >
                    {t("Удалить из черновика")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      <p role="status" className="mt-3 text-sm text-muted-foreground">
        {t(stage || (value ? "Готово" : ""))}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
export function SchoolMediaReview({
  schoolId,
  value,
}: {
  schoolId: string;
  value?: SchoolMediaSelection;
}) {
  const { t } = useAdminI18n();
  const [opened, setOpened] = useState<SchoolMediaImage | null>(null);
  return (
    <div className="my-6 space-y-5">
      <h3 className="font-sans text-lg font-semibold tracking-normal">{t("Главное фото школы")}</h3>
      {value?.cover ? (
        <button
          type="button"
          className="block w-full max-w-lg border hairline"
          aria-label={t("Открыть фотографию")}
          onClick={() => setOpened(value.cover!)}
        >
          <Preview schoolId={schoolId} image={value.cover} />
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">{t("Фото не добавлено")}</p>
      )}
      <h3 className="font-sans text-lg font-semibold tracking-normal">
        {t("Школьная жизнь")}{" "}
        <span className="font-sans text-xs font-normal text-muted-foreground">
          {t("Фотографий")}: {value?.gallery.length ?? 0}
        </span>
      </h3>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value?.gallery.map((image) => (
          <button
            type="button"
            key={image.asset_id}
            aria-label={t("Открыть фотографию")}
            onClick={() => setOpened(image)}
          >
            <Preview schoolId={schoolId} image={image} />
          </button>
        ))}
      </div>
      <Dialog
        open={!!opened}
        onOpenChange={(open) => {
          if (!open) setOpened(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="z-[1501] max-h-[90vh] max-w-[calc(100%-2rem)] overflow-auto font-sans sm:max-w-4xl"
        >
          <DialogTitle className="sr-only font-sans tracking-normal">
            {t("Фотография школы")}
          </DialogTitle>
          {opened && <Preview key={opened.asset_id} schoolId={schoolId} image={opened} large />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
