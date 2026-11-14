export type SchoolMediaImage = {
  asset_id: string;
  kind: "cover" | "gallery";
  main_key: string;
  thumb_key: string;
  width: number;
  height: number;
  thumb_width: number;
  thumb_height: number;
};
export type SchoolMediaSelection = { cover: SchoolMediaImage | null; gallery: SchoolMediaImage[] };
export const emptySchoolMedia = (): SchoolMediaSelection => ({ cover: null, gallery: [] });
export function schoolMediaFromRow(row: Record<string, unknown>): SchoolMediaImage {
  return {
    asset_id: String(row.id),
    kind: row.kind as "cover" | "gallery",
    main_key: String(row.main_key),
    thumb_key: String(row.thumb_key),
    width: Number(row.width),
    height: Number(row.height),
    thumb_width: Number(row.thumb_width),
    thumb_height: Number(row.thumb_height),
  };
}
export function schoolPublicImageUrl(image: SchoolMediaImage, variant: "main" | "thumb") {
  const key = variant === "main" ? image.main_key : image.thumb_key;
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  if (
    !new RegExp(`^${uuid}$`, "i").test(image.asset_id) ||
    !["cover", "gallery"].includes(image.kind)
  )
    return "";
  if (
    !new RegExp(
      `^schools/${uuid}/${image.kind}/${image.asset_id}/${image.kind === "cover" ? (variant === "main" ? "main" : "card") : variant === "main" ? "image" : "thumb"}\\.webp$`,
      "i",
    ).test(key) ||
    !new RegExp(`^${uuid}$`, "i").test(image.asset_id) ||
    !["cover", "gallery"].includes(image.kind)
  )
    return "";
  return `https://media.kara-kulja.kg/${key}`;
}
