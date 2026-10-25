import { supabase } from "@/lib/supabase";
import { NEWS_IMAGE_UPLOAD_LIMIT } from "@/lib/image-optimizer";

export interface NewsGalleryImage {
  key: string;
  url: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_IMAGE_SIZE = NEWS_IMAGE_UPLOAD_LIMIT;

function validateNewsUploadImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error("Допустимы только JPG, PNG, WebP и AVIF.");
  }
  if (!file.size || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Подготовленное изображение не должно превышать 5 МБ.");
  }
}

async function invokeNewsMedia<T>(body: FormData | Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("news-media", { body });
  if (error) throw new Error("Операция с хранилищем не выполнена.");
  if (!data || typeof data !== "object" || "error" in data) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Операция с хранилищем не выполнена.",
    );
  }
  return data as T;
}

async function uploadImage(
  action: "upload-cover" | "upload-gallery",
  mediaFolderId: string,
  file: File,
) {
  validateNewsUploadImage(file);
  const body = new FormData();
  body.set("action", action);
  body.set("mediaFolderId", mediaFolderId);
  body.set("file", file);
  return invokeNewsMedia<NewsGalleryImage>(body);
}

export function uploadNewsCover(mediaFolderId: string, file: File) {
  return uploadImage("upload-cover", mediaFolderId, file);
}

export function uploadNewsGalleryImage(mediaFolderId: string, file: File) {
  return uploadImage("upload-gallery", mediaFolderId, file);
}

export async function deleteNewsObject(mediaFolderId: string, key: string) {
  await invokeNewsMedia<{ deleted: true }>({
    action: "delete-object",
    mediaFolderId,
    key,
  });
}

export async function deleteNewsFolder(mediaFolderId: string) {
  await invokeNewsMedia<{ deleted: true; count: number }>({
    action: "delete-news-folder",
    mediaFolderId,
  });
}
