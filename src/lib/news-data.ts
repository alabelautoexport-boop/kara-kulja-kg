import { supabase } from "@/lib/supabase";
import { deleteNewsFolder, type NewsGalleryImage } from "@/lib/news-media";

export type { NewsGalleryImage } from "@/lib/news-media";

export interface NewsRecord {
  id: string;
  slug: string;
  title_kg: string;
  title_ru: string | null;
  title_en: string | null;
  excerpt_kg: string | null;
  excerpt_ru: string | null;
  excerpt_en: string | null;
  body_kg: string | null;
  body_ru: string | null;
  body_en: string | null;
  cover_image: string | null;
  gallery_images: NewsGalleryImage[];
  media_folder_id: string;
  published_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type NewsInput = Omit<NewsRecord, "id" | "created_at" | "updated_at">;

const NEWS_COLUMNS = "*";

function readableDataError(message: string) {
  if (message.includes("news_slug_key") || message.toLowerCase().includes("duplicate")) {
    return new Error("Новость с таким slug уже существует.");
  }
  return new Error("Не удалось выполнить операцию с новостью.");
}

export async function getPublishedNews() {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });
  if (error) throw readableDataError(error.message);
  return data as NewsRecord[];
}

export async function getLatestNews(limit: number) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw readableDataError(error.message);
  return data as NewsRecord[];
}

export async function getHomepageNews(limit = 3) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw readableDataError(error.message);
  return data as NewsRecord[];
}

export async function getPublishedNewsBySlug(slug: string) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .not("published_at", "is", null)
    .maybeSingle();
  if (error) throw readableDataError(error.message);
  return data as NewsRecord | null;
}

export async function adminGetAllNews() {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw readableDataError(error.message);
  return data as NewsRecord[];
}

export async function adminGetNewsById(id: string) {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw readableDataError(error.message);
  return data as NewsRecord | null;
}

export async function createNews(input: NewsInput) {
  const { data, error } = await supabase.from("news").insert(input).select(NEWS_COLUMNS).single();
  if (error) throw readableDataError(error.message);
  return data as NewsRecord;
}

export async function updateNews(id: string, input: NewsInput) {
  const { data, error } = await supabase
    .from("news")
    .update(input)
    .eq("id", id)
    .select(NEWS_COLUMNS)
    .single();
  if (error) throw readableDataError(error.message);
  return data as NewsRecord;
}

export async function updateNewsGalleryImages(id: string, galleryImages: NewsGalleryImage[]) {
  const { data, error } = await supabase
    .from("news")
    .update({ gallery_images: galleryImages })
    .eq("id", id)
    .select(NEWS_COLUMNS)
    .single();
  if (error) throw readableDataError(error.message);
  return data as NewsRecord;
}

export async function deleteNews(news: Pick<NewsRecord, "id" | "media_folder_id">) {
  try {
    await deleteNewsFolder(news.media_folder_id);
  } catch {
    throw new Error("Новость не удалена, так как не удалось удалить связанные фотографии.");
  }

  const { error } = await supabase.from("news").delete().eq("id", news.id);
  if (error) throw readableDataError(error.message);
}
