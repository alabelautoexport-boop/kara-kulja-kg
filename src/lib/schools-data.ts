import { supabase } from "@/lib/supabase";
import type { Lang } from "@/lib/i18n";
import type { OrtSummary } from "@/lib/school-ort";
import { schoolRpcError } from "@/lib/school-errors";
import type { ActiveSchoolDraft } from "@/lib/school-form-validation";

export type SchoolInfo = {
  slug?: string;
  name_kg: string;
  name_ru: string;
  name_en: string;
  territory_slug: string;
  village_slug: string;
  director_name: string;
  director_phone: string;
  office_phone: string;
  address_kg: string;
  address_ru: string;
  address_en: string;
  current_academic_year: string;
};
export type SchoolYearStats = {
  academic_year: string;
  total_students: number | null;
  total_teachers: number | null;
  grade11_graduates: number | null;
};
export type SchoolOrtYear = { year: number; academic_year: string; scores: number[] };
export type SchoolAchievement = {
  date: string;
  title_kg: string;
  title_ru: string;
  title_en: string;
  description_kg: string;
  description_ru: string;
  description_en: string;
  category: string;
};
export type SchoolResource = Omit<SchoolAchievement, "date" | "category"> & {
  type: string;
  url: string;
  year: number | null;
  source: string;
};
export type SchoolDraft = {
  info: SchoolInfo;
  stats: SchoolYearStats[];
  ort: SchoolOrtYear[];
  achievements: SchoolAchievement[];
  resources: SchoolResource[];
};
export type PublicSchoolDocument = Omit<SchoolDraft, "ort"> & {
  ort: { year: number; academic_year: string; summary: OrtSummary }[];
};
export type SchoolPublication = {
  school_id: string;
  slug: string;
  document: PublicSchoolDocument;
  published_at: string;
};
export type SchoolRecord = SchoolInfo & {
  id: string;
  slug: string;
  status: "draft" | "review" | "published";
  revision: number;
  review_note: string | null;
  is_archived?: boolean;
  archived_at?: string | null;
};

export function localizedSchoolField(record: object, field: string, lang: Lang): string {
  const values = record as Record<string, unknown>;
  return String(values[`${field}_${lang}`] || values[`${field}_kg`] || "");
}

export async function getPublishedSchools() {
  const { data, error } = await supabase
    .from("school_publications")
    .select("school_id,slug,document,published_at")
    .eq("is_published", true)
    .order("slug");
  if (error) throw new Error("schools_unavailable");
  return data as SchoolPublication[];
}
export async function getPublishedSchool(slug: string) {
  const { data, error } = await supabase
    .from("school_publications")
    .select("school_id,slug,document,published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error("schools_unavailable");
  return data as SchoolPublication | null;
}
export async function getEditableSchools() {
  const { data, error } = await supabase.from("schools").select("*").order("name_kg");
  if (error) throw new Error("Не удалось загрузить школы.");
  return data as SchoolRecord[];
}
export async function loadSchoolDraft(id: string) {
  const [schools, stats, ort, achievements, resources] = await Promise.all([
    supabase.from("schools").select("*").eq("id", id).single(),
    supabase
      .from("school_year_stats")
      .select("*")
      .eq("school_id", id)
      .order("academic_year", { ascending: false }),
    supabase
      .from("school_ort_years")
      .select("*")
      .eq("school_id", id)
      .order("year", { ascending: false }),
    supabase
      .from("school_achievements")
      .select("*")
      .eq("school_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("school_ort_resources")
      .select("*")
      .eq("school_id", id)
      .order("year", { ascending: false }),
  ]);
  if ([schools, stats, ort, achievements, resources].some((r) => r.error))
    throw new Error("Не удалось загрузить школы.");
  const record = schools.data as SchoolRecord;
  const info = {
    ...Object.fromEntries(
      Object.keys(EMPTY_SCHOOL_INFO).map((key) => [key, record[key as keyof SchoolInfo] ?? ""]),
    ),
    slug: record.slug,
  } as SchoolInfo;
  return {
    record,
    draft: {
      info,
      stats: stats.data,
      ort: ort.data,
      achievements: achievements.data,
      resources: resources.data,
    } as SchoolDraft,
  };
}
export async function saveSchoolDraft(
  id: string,
  revision: number,
  draft: ActiveSchoolDraft,
  submit: boolean,
) {
  const { error } = await supabase.rpc("save_school_active_draft", {
    p_school_id: id,
    p_revision: revision,
    p_payload: draft,
    p_submit: submit,
  });
  if (error) throw new Error(schoolRpcError(error));
}
export async function createSchool(name: string) {
  const { data, error } = await supabase.rpc("create_school_auto", { p_name_kg: name });
  if (error) throw new Error(schoolRpcError(error));
  return data as string;
}
export async function archiveSchool(id: string, revision: number, archived: boolean) {
  const { error } = await supabase.rpc("set_school_archived", {
    p_school_id: id,
    p_revision: revision,
    p_archived: archived,
  });
  if (error) throw new Error(schoolRpcError(error));
}
export async function permanentlyDeleteSchool(id: string, revision: number, name: string) {
  const { error } = await supabase.rpc("permanently_delete_school", {
    p_school_id: id,
    p_revision: revision,
    p_confirm_name: name,
  });
  if (error) throw new Error(schoolRpcError(error));
}
export async function reviewSchool(
  id: string,
  revision: number,
  action: "publish" | "return" | "unpublish",
  note: string,
) {
  const { error } = await supabase.rpc("review_school", {
    p_school_id: id,
    p_revision: revision,
    p_action: action,
    p_note: note,
  });
  if (error) throw new Error(schoolRpcError(error));
}
export const EMPTY_SCHOOL_INFO: SchoolInfo = {
  name_kg: "",
  name_ru: "",
  name_en: "",
  territory_slug: "",
  village_slug: "",
  director_name: "",
  director_phone: "",
  office_phone: "",
  address_kg: "",
  address_ru: "",
  address_en: "",
  current_academic_year: "",
};
