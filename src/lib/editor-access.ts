export type AccessArea = "admin" | "news" | "school";
export type AccessRights = { admin: boolean; news: boolean; school: boolean };
export function mayEnterArea(rights: AccessRights, area: AccessArea) {
  return (
    rights.admin || (area === "news" ? rights.news : area === "school" ? rights.school : false)
  );
}
