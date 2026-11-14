import { validInstitutionShortNames, type InstitutionShortNames } from "./institution-names";
import { supabase } from "./supabase";
import { schoolRpcError } from "./school-errors";
import { TERRITORIES } from "./territories-data";
import {
  isKindergartenType,
  type KindergartenType,
  type InstitutionSource,
} from "./institution-types";

export type KindergartenInfo = InstitutionShortNames & {
  type: KindergartenType;
  name_kg: string;
  name_ru: string;
  name_en: string;
  address_kg: string;
  address_ru: string;
  address_en: string;
  territory_slug: string;
  village_slug: string;
};
export type KindergartenRecord = KindergartenInfo & {
  id: string;
  slug: string;
  status: "draft" | "published";
  revision: number;
  source_metadata: InstitutionSource | Record<string, never>;
};
export type KindergartenPublication = {
  kindergarten_id: string;
  slug: string;
  document: { info: KindergartenInfo };
  published_at: string;
};
export const EMPTY_KINDERGARTEN: KindergartenInfo = {
  short_name_kg: "",
  short_name_ru: "",
  short_name_en: "",
  type: "kindergarten",
  name_kg: "",
  name_ru: "",
  name_en: "",
  address_kg: "",
  address_ru: "",
  address_en: "",
  territory_slug: "",
  village_slug: "",
};
export function validKindergarten(info: KindergartenInfo) {
  return (
    validInstitutionShortNames(info) &&
    isKindergartenType(info.type) &&
    info.name_kg.trim().length > 0 &&
    [info.name_kg, info.name_ru, info.name_en].every(
      (s) => typeof s === "string" && s.length <= 300,
    ) &&
    [info.address_kg, info.address_ru, info.address_en].every(
      (s) => typeof s === "string" && s.length <= 2000,
    ) &&
    TERRITORIES.some(
      (t) => t.slug === info.territory_slug && t.villages.some((v) => v.slug === info.village_slug),
    )
  );
}
export async function getPublishedKindergartens() {
  const { data, error } = await supabase
    .from("kindergarten_publications")
    .select("kindergarten_id,slug,document,published_at")
    .eq("is_published", true)
    .order("slug");
  if (error) throw new Error("kindergartens_unavailable");
  return data as KindergartenPublication[];
}
export async function getPublishedKindergarten(slug: string) {
  const { data, error } = await supabase
    .from("kindergarten_publications")
    .select("kindergarten_id,slug,document,published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error("kindergartens_unavailable");
  return data as KindergartenPublication | null;
}
export async function getEditableKindergartens() {
  const { data, error } = await supabase.from("kindergartens").select("*").order("name_kg");
  if (error) throw new Error("Не удалось загрузить детские сады.");
  return data as KindergartenRecord[];
}
function kindergartenRpcError(error: { code?: string; message?: string }) {
  if (error.message?.includes("Revision conflict"))
    return "Данные изменились. Откройте детский сад заново.";
  if (error.code === "P0002") return "Детский сад не найден. Обновите список.";
  if (error.code === "PGRST202") return "Требуется миграция каталога детских садов.";
  return schoolRpcError(error);
}

export async function saveKindergarten(
  record: KindergartenRecord | null,
  info: KindergartenInfo,
  publish: boolean,
) {
  if (!validKindergarten(info)) throw new Error("Проверьте название, тип, аймак и село.");
  // Explicit whitelist: a displayed record never echoes status, revision or metadata into info.
  const payload = Object.fromEntries(
    Object.keys(EMPTY_KINDERGARTEN).map((k) => [k, info[k as keyof KindergartenInfo]]),
  );
  if (!record) {
    const { data, error } = await supabase.rpc("create_kindergarten", {
      p_payload: payload,
      p_publish: publish,
    });
    if (error) throw new Error(kindergartenRpcError(error));
    return data as string;
  }
  const { error } = await supabase.rpc("save_kindergarten", {
    p_id: record.id,
    p_revision: record.revision,
    p_payload: payload,
    p_publish: publish,
  });
  if (error) throw new Error(kindergartenRpcError(error));
  return record.id;
}
export async function unpublishKindergarten(record: KindergartenRecord) {
  const { error } = await supabase.rpc("unpublish_kindergarten", {
    p_id: record.id,
    p_revision: record.revision,
  });
  if (error) throw new Error(kindergartenRpcError(error));
}
