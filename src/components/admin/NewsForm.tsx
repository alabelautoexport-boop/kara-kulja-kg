import { useAdminI18n } from "@/lib/admin-i18n";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ImagePlus, Save, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createNewsSlug, sanitizeNewsHtml } from "@/lib/news-content";
import {
  formatImageBytes,
  optimizeNewsImage,
  type OptimizedImageResult,
} from "@/lib/image-optimizer";
import {
  createNews,
  updateNews,
  updateNewsGalleryImages,
  type NewsInput,
  type NewsGalleryImage,
  type NewsRecord,
} from "@/lib/news-data";
import { deleteNewsObject, uploadNewsCover, uploadNewsGalleryImage } from "@/lib/news-media";

type EditableNews = Pick<
  NewsInput,
  | "slug"
  | "title_kg"
  | "title_ru"
  | "title_en"
  | "excerpt_kg"
  | "excerpt_ru"
  | "excerpt_en"
  | "body_kg"
  | "body_ru"
  | "body_en"
  | "cover_image"
  | "gallery_images"
  | "media_folder_id"
  | "published_at"
  | "is_published"
  | "is_featured"
>;

const emptyNews = (): EditableNews => ({
  slug: "",
  title_kg: "",
  title_ru: "",
  title_en: "",
  excerpt_kg: "",
  excerpt_ru: "",
  excerpt_en: "",
  body_kg: "",
  body_ru: "",
  body_en: "",
  cover_image: null,
  gallery_images: [],
  media_folder_id: crypto.randomUUID(),
  published_at: null,
  is_published: false,
  is_featured: false,
});

function getLocalPublicationParts(value: string | null) {
  if (!value) return { date: "", time: "" };

  const timestamp = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");

  return {
    date: `${timestamp.getFullYear()}-${pad(timestamp.getMonth() + 1)}-${pad(timestamp.getDate())}`,
    time: `${pad(timestamp.getHours())}:${pad(timestamp.getMinutes())}`,
  };
}

function toPublishedAt(date: string, time: string) {
  if (!date) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

function optional(value: string | null) {
  return value?.trim() || null;
}

const inputClass =
  "mt-2 w-full border hairline bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--beige)]";

type GalleryItem =
  | ({ kind: "stored" } & NewsGalleryImage)
  | {
      kind: "pending";
      id: string;
      file: File;
      url: string;
      optimization: OptimizedImageResult;
    };

const storedGalleryItems = (images: NewsGalleryImage[] | undefined): GalleryItem[] =>
  (images ?? []).map((image) => ({ kind: "stored", ...image }));

function optimizationSummary(result: OptimizedImageResult) {
  if (!result.wasOptimized) return `Оригинал сохранён: ${formatImageBytes(result.originalBytes)}`;
  return `${formatImageBytes(result.originalBytes)} -> ${formatImageBytes(result.optimizedBytes)}`;
}

function LanguageFields({
  language,
  titleLabel,
  values,
  setField,
}: {
  language: string;
  titleLabel: string;
  values: EditableNews;
  setField: (field: keyof EditableNews, value: string) => void;
}) {
  const suffix = language === "Кыргызча" ? "kg" : language === "Русский" ? "ru" : "en";
  const titleKey = `title_${suffix}` as keyof EditableNews;
  const excerptKey = `excerpt_${suffix}` as keyof EditableNews;
  const bodyKey = `body_${suffix}` as keyof EditableNews;

  return (
    <fieldset className="border-t hairline pt-8">
      <legend className="font-display text-2xl">{language}</legend>
      <div className="mt-5 grid gap-5">
        <label className="text-sm text-muted-foreground">
          {titleLabel}
          <input
            className={inputClass}
            value={(values[titleKey] as string | null) ?? ""}
            onChange={(event) => setField(titleKey, event.target.value)}
            required={suffix === "kg"}
          />
        </label>
        <label className="text-sm text-muted-foreground">
          {language === "English" ? "Short description" : "Краткое описание"}
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={(values[excerptKey] as string | null) ?? ""}
            onChange={(event) => setField(excerptKey, event.target.value)}
          />
        </label>
        <div>
          <div className="mb-2 text-sm text-muted-foreground">
            {language === "English" ? "News text" : "Текст новости"}
          </div>
          <RichTextEditor
            label={`${language}: ${language === "English" ? "News text" : "Текст новости"}`}
            value={(values[bodyKey] as string | null) ?? ""}
            onChange={(value) => setField(bodyKey, value)}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function NewsForm({ initial }: { initial?: NewsRecord }) {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState(initial?.id ?? null);
  const [values, setValues] = useState<EditableNews>(() => initial ?? emptyNews());
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [publicationDate, setPublicationDate] = useState(
    () => getLocalPublicationParts(initial?.published_at ?? null).date,
  );
  const [publicationTime, setPublicationTime] = useState(
    () => getLocalPublicationParts(initial?.published_at ?? null).time,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverOptimization, setCoverOptimization] = useState<OptimizedImageResult | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() =>
    storedGalleryItems(initial?.gallery_images),
  );
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [mediaStatus, setMediaStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : values.cover_image),
    [coverFile, values.cover_image],
  );

  useEffect(
    () => () => {
      if (coverFile && coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverFile, coverPreview],
  );

  const setField = (field: keyof EditableNews, value: string | boolean | null) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const setTitleKg = (title: string) => {
    setValues((current) => ({
      ...current,
      title_kg: title,
      slug: slugEdited ? current.slug : createNewsSlug(title),
    }));
  };

  const selectCoverFile = async (file: File | null) => {
    if (!file) return;
    setCoverBusy(true);
    setError("");
    setMediaStatus("Оптимизация изображения...");
    try {
      const result = await optimizeNewsImage(file);
      setCoverFile(result.file);
      setCoverOptimization(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось подготовить изображение.");
    } finally {
      setCoverBusy(false);
      setMediaStatus("");
    }
  };

  const addGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    const selected = Array.from(files);
    if (galleryItems.length + selected.length > 20) {
      setError("В фотогалерее может быть не более 20 изображений.");
      return;
    }

    setGalleryBusy(true);
    const prepared: GalleryItem[] = [];
    const failed: string[] = [];
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      setMediaStatus(`Оптимизация: ${index + 1} из ${selected.length}`);
      try {
        const result = await optimizeNewsImage(file);
        prepared.push({
          kind: "pending",
          id: crypto.randomUUID(),
          file: result.file,
          url: URL.createObjectURL(result.file),
          optimization: result,
        });
      } catch {
        failed.push(file.name);
      }
    }
    if (prepared.length) setGalleryItems((current) => [...current, ...prepared]);
    if (failed.length) {
      setError(`Не удалось подготовить изображение: ${failed.join(", ")}`);
    }
    setGalleryBusy(false);
    setMediaStatus("");
  };

  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= galleryItems.length) return;
    setGalleryItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeGalleryItem = async (item: GalleryItem) => {
    if (item.kind === "pending") {
      URL.revokeObjectURL(item.url);
      setGalleryItems((current) => current.filter((candidate) => candidate !== item));
      return;
    }

    setGalleryBusy(true);
    setError("");
    try {
      await deleteNewsObject(values.media_folder_id, item.key);
      const next = galleryItems.filter((candidate) => candidate !== item);
      if (recordId) {
        await updateNewsGalleryImages(
          recordId,
          next
            .filter(
              (candidate): candidate is GalleryItem & { kind: "stored" } =>
                candidate.kind === "stored",
            )
            .map(({ key, url }) => ({ key, url })),
        );
      }
      setGalleryItems(next);
    } catch {
      setError("Не удалось удалить фотографию из хранилища.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || coverBusy || galleryBusy) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!values.title_kg.trim()) throw new Error("Кыргызский заголовок обязателен.");
      if (!values.slug.trim()) throw new Error("Slug обязателен.");

      let coverImage = values.cover_image;
      if (coverFile) {
        setMediaStatus("Загрузка изображения...");
        const uploadedCover = await uploadNewsCover(values.media_folder_id, coverFile);
        coverImage = uploadedCover.url;
        setField("cover_image", coverImage);
        setCoverFile(null);
        setCoverOptimization(null);
      }

      const uploadedGallery = new Map<string, NewsGalleryImage>();
      const failedGalleryUploads: GalleryItem[] = [];
      const pendingGallery = galleryItems.filter(
        (item): item is Extract<GalleryItem, { kind: "pending" }> => item.kind === "pending",
      );
      let galleryUploadIndex = 0;
      for (const item of pendingGallery) {
        galleryUploadIndex += 1;
        setMediaStatus(`Загрузка: ${galleryUploadIndex} из ${pendingGallery.length}`);
        try {
          uploadedGallery.set(
            item.id,
            await uploadNewsGalleryImage(values.media_folder_id, item.file),
          );
        } catch {
          failedGalleryUploads.push(item);
        }
      }
      const galleryImages = galleryItems.flatMap((item) => {
        if (item.kind === "stored") return [{ key: item.key, url: item.url }];
        const uploaded = uploadedGallery.get(item.id);
        return uploaded ? [uploaded] : [];
      });
      // Keep successful uploads available for retry even if the database save fails.
      const nextGalleryItems: GalleryItem[] = galleryItems.map((item) => {
        if (item.kind === "stored") return item;
        const uploaded = uploadedGallery.get(item.id);
        if (!uploaded) return item;
        URL.revokeObjectURL(item.url);
        return { kind: "stored", ...uploaded };
      });
      setGalleryItems(nextGalleryItems);

      const selectedPublishedAt = toPublishedAt(publicationDate, publicationTime);
      const publishedAt =
        values.is_published && !selectedPublishedAt
          ? new Date().toISOString()
          : selectedPublishedAt;

      const input: NewsInput = {
        slug: createNewsSlug(values.slug),
        title_kg: values.title_kg.trim(),
        title_ru: optional(values.title_ru),
        title_en: optional(values.title_en),
        excerpt_kg: optional(values.excerpt_kg),
        excerpt_ru: optional(values.excerpt_ru),
        excerpt_en: optional(values.excerpt_en),
        body_kg: optional(sanitizeNewsHtml(values.body_kg)),
        body_ru: optional(sanitizeNewsHtml(values.body_ru)),
        body_en: optional(sanitizeNewsHtml(values.body_en)),
        cover_image: coverImage,
        gallery_images: galleryImages,
        media_folder_id: values.media_folder_id,
        published_at: publishedAt,
        is_published: values.is_published,
        is_featured: values.is_featured,
      };

      const saved = recordId ? await updateNews(recordId, input) : await createNews(input);
      setRecordId(saved.id);
      const savedPublication = getLocalPublicationParts(saved.published_at);
      setValues(saved);
      setPublicationDate(savedPublication.date);
      setPublicationTime(savedPublication.time);
      setCoverFile(null);
      setCoverOptimization(null);
      setGalleryItems(nextGalleryItems);
      setMessage(saved.is_published ? "Новость опубликована и сохранена." : "Новость сохранена.");
      if (failedGalleryUploads.length) {
        const failedNames = failedGalleryUploads
          .filter((item) => item.kind === "pending")
          .map((item) => item.file.name);
        setError(`Не удалось загрузить изображение: ${failedNames.join(", ")}`);
      }

      if (!initial && !failedGalleryUploads.length) {
        await navigate({ to: "/admin/news/$id/edit", params: { id: saved.id }, replace: true });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить новость.");
    } finally {
      setSaving(false);
      setMediaStatus("");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-10">
      <section className="grid gap-5 border-t hairline pt-8 md:grid-cols-2">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-muted-foreground">
            {t("Дата публикации")}
            <input
              type="date"
              className={inputClass}
              style={{ colorScheme: "dark" }}
              value={publicationDate}
              onChange={(event) => setPublicationDate(event.target.value)}
            />
          </label>
          <label className="text-sm text-muted-foreground">
            {t("Время публикации")}
            <input
              type="time"
              className={inputClass}
              style={{ colorScheme: "dark" }}
              value={publicationTime}
              onChange={(event) => setPublicationTime(event.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col justify-end gap-4 pb-1 text-sm">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(event) => setField("is_published", event.target.checked)}
            />
            {t("Опубликовано")}
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={values.is_featured}
              onChange={(event) => setField("is_featured", event.target.checked)}
            />
            {t("Важная новость")}
          </label>
        </div>
      </section>

      <fieldset className="border-t hairline pt-8">
        <legend className="font-display text-2xl">{t("Обложка")}</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-start">
          <div className="aspect-[16/10] overflow-hidden border hairline bg-muted/20">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt={t("Текущая обложка")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImagePlus className="h-8 w-8" />
              </div>
            )}
          </div>
          <label className="text-sm text-muted-foreground">
            {t("Загрузить или заменить изображение")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className={`${inputClass} file:mr-4 file:border-0 file:bg-[var(--beige)] file:px-3 file:py-2 file:text-primary-foreground`}
              onChange={(event) => {
                void selectCoverFile(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
              disabled={saving || coverBusy || galleryBusy}
            />
            <span className="mt-2 block text-xs leading-5">
              {t(
                "Можно загрузить оригинал фотографии до 20 МБ. Большие изображения будут автоматически оптимизированы без заметной потери качества.",
              )}
            </span>
            {coverOptimization && (
              <span className="mt-2 block text-xs text-[var(--beige)]">
                {t(optimizationSummary(coverOptimization))}
              </span>
            )}
          </label>
        </div>
      </fieldset>

      <fieldset className="border-t hairline pt-8">
        <legend className="font-display text-2xl">{t("Фотогалерея")}</legend>
        <div className="mt-5 flex flex-col gap-5">
          <label className="max-w-xl text-sm text-muted-foreground">
            {t("Добавить изображения")}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              className={`${inputClass} file:mr-4 file:border-0 file:bg-[var(--beige)] file:px-3 file:py-2 file:text-primary-foreground`}
              onChange={(event) => {
                void addGalleryFiles(event.target.files);
                event.currentTarget.value = "";
              }}
              disabled={saving || coverBusy || galleryBusy || galleryItems.length >= 20}
            />
            <span className="mt-2 block text-xs leading-5">
              {t(
                "До 20 изображений. Можно загружать оригиналы до 20 МБ каждый - большие фотографии будут автоматически оптимизированы.",
              )}
            </span>
          </label>

          {galleryItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {galleryItems.map((item, index) => (
                <div
                  key={item.kind === "stored" ? item.key : item.id}
                  className="border hairline bg-background/60 p-2"
                >
                  <div className="aspect-square overflow-hidden bg-muted/20">
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  {item.kind === "pending" && (
                    <p className="mt-2 truncate text-xs text-muted-foreground">
                      {t(optimizationSummary(item.optimization))}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      title={t("Переместить влево")}
                      aria-label={t("Переместить фотографию влево")}
                      disabled={index === 0 || saving || coverBusy || galleryBusy}
                      onClick={() => moveGalleryItem(index, -1)}
                      className="flex h-9 items-center justify-center border hairline disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={t("Переместить вправо")}
                      aria-label={t("Переместить фотографию вправо")}
                      disabled={
                        index === galleryItems.length - 1 || saving || coverBusy || galleryBusy
                      }
                      onClick={() => moveGalleryItem(index, 1)}
                      className="flex h-9 items-center justify-center border hairline disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={t("Удалить фотографию")}
                      aria-label={t("Удалить фотографию")}
                      disabled={saving || coverBusy || galleryBusy}
                      onClick={() => void removeGalleryItem(item)}
                      className="flex h-9 items-center justify-center border hairline hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {mediaStatus && (
        <p role="status" aria-live="polite" className="text-sm text-[var(--beige)]">
          {t(mediaStatus)}
        </p>
      )}

      <fieldset className="border-t hairline pt-8">
        <legend className="font-display text-2xl">Кыргызча</legend>
        <div className="mt-5 grid gap-5">
          <label className="text-sm text-muted-foreground">
            Аталышы
            <input
              className={inputClass}
              value={values.title_kg}
              onChange={(event) => setTitleKg(event.target.value)}
              required
            />
          </label>
          <label className="text-sm text-muted-foreground">
            Кыскача сүрөттөмө
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={values.excerpt_kg ?? ""}
              onChange={(event) => setField("excerpt_kg", event.target.value)}
            />
          </label>
          <div>
            <div className="mb-2 text-sm text-muted-foreground">Жаңылыктын тексти</div>
            <RichTextEditor
              label="Кыргызча: жаңылыктын тексти"
              value={values.body_kg ?? ""}
              onChange={(value) => setField("body_kg", value)}
            />
          </div>
        </div>
      </fieldset>

      <LanguageFields
        language="Русский"
        titleLabel="Заголовок"
        values={values}
        setField={(field, value) => setField(field, value)}
      />
      <LanguageFields
        language="English"
        titleLabel="Title"
        values={values}
        setField={(field, value) => setField(field, value)}
      />

      <fieldset className="border-t hairline pt-8">
        <legend className="font-display text-xl">{t("Дополнительно")}</legend>
        <label className="mt-5 block max-w-xl text-sm text-muted-foreground">
          Slug
          <input
            className={inputClass}
            value={values.slug}
            onChange={(event) => {
              setSlugEdited(true);
              setField("slug", event.target.value);
            }}
            required
          />
          <span className="mt-2 block text-xs">
            {t("Адрес новости. Обычно заполняется автоматически.")}
          </span>
        </label>
      </fieldset>

      {(message || error) && (
        <p
          role="status"
          className={`border px-4 py-3 text-sm ${error ? "border-destructive/50 text-destructive" : "hairline text-[var(--beige)]"}`}
        >
          {t(error || message)}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || coverBusy || galleryBusy}
        className="inline-flex min-h-11 items-center gap-2 bg-[var(--beige)] px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {t(saving ? "Сохранение..." : "Сохранить новость")}
      </button>
    </form>
  );
}
