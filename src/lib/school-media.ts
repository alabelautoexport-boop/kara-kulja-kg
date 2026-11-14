import { supabase } from "@/lib/supabase";
import type { SchoolImageKind } from "./school-image-optimizer";
import type { SchoolMediaImage } from "./school-media-model";
import { webpDimensions } from "./school-image-format";
async function invoke<T>(body: FormData | Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("school-media", { body });
  if (error || !data || (typeof data === "object" && "error" in data))
    throw new Error("Медиа школы недоступны. Проверьте настройку функции или повторите загрузку.");
  return data as T;
}
export async function uploadSchoolImage(
  schoolId: string,
  kind: SchoolImageKind,
  main: File,
  thumb: File,
) {
  const body = new FormData();
  body.set("action", "upload");
  body.set("schoolId", schoolId);
  body.set("kind", kind);
  body.set("main", main);
  body.set("thumb", thumb);
  return (await invoke<{ asset: SchoolMediaImage }>(body)).asset;
}
export async function previewSchoolImage(
  schoolId: string,
  assetId: string,
  variant: "main" | "thumb",
) {
  // The installed functions SDK reads image/webp as text. Fetch authenticated binary
  // directly so the server can return its correct MIME without corrupting bytes.
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Не удалось загрузить фотографию.");
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL.trim()}/functions/v1/school-media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "preview", schoolId, assetId, variant }),
      cache: "no-store",
    },
  );
  if (!response.ok || response.headers.get("Content-Type")?.split(";")[0].trim() !== "image/webp")
    throw new Error("Не удалось загрузить фотографию.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  webpDimensions(bytes);
  return new Blob([bytes], { type: "image/webp" });
}
export async function publishSchoolMedia(schoolId: string, revision: number, note: string) {
  try {
    return await invoke<{ published: true }>({ action: "publish", schoolId, revision, note });
  } catch {
    throw new Error(
      "Не удалось опубликовать фотографии школы. Предыдущая опубликованная версия сохранена. Повторите попытку.",
    );
  }
}
export async function cleanupSchoolMedia(schoolId: string) {
  await invoke({ action: "cleanup", schoolId });
}
