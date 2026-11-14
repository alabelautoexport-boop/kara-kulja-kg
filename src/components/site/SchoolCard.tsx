import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n, displayStructuredValue } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import {
  localizedSchoolField,
  type PublicSchoolDocument,
  type SchoolPublication,
} from "@/lib/schools-data";
import {
  TERRITORIES,
  getOfficialVillage,
  displayTerritoryName,
  displayVillageName,
} from "@/lib/territories-data";
import { schoolPublicImageUrl } from "@/lib/school-media-model";
export function SchoolLocation({
  info,
}: {
  info: Pick<PublicSchoolDocument["info"], "territory_slug" | "village_slug">;
}) {
  const { lang } = useI18n();
  const territory = TERRITORIES.find((t) => t.slug === info.territory_slug),
    village = getOfficialVillage(info.village_slug);
  return (
    <>
      {[
        village && displayVillageName(village, lang),
        territory && displayTerritoryName(territory, lang),
      ]
        .filter(Boolean)
        .join(" · ") || displayStructuredValue(null, lang)}
    </>
  );
}
export function SchoolCard({ school }: { school: SchoolPublication }) {
  const { lang } = useI18n(),
    c = SCHOOL_COPY[lang],
    doc = school.document;
  const cover = doc.media?.cover,
    image = cover && schoolPublicImageUrl(cover, "thumb");
  return (
    <Link
      to="/schools/$slug"
      params={{ slug: school.slug }}
      className="group w-full min-w-0 max-w-md overflow-hidden border hairline transition-colors hover:border-[var(--beige)]"
    >
      {image && cover && (
        <img
          src={image}
          alt={localizedSchoolField(doc.info, "name", lang)}
          width={cover.thumb_width}
          height={cover.thumb_height}
          loading="lazy"
          decoding="async"
          className="aspect-video max-h-44 w-full object-cover"
        />
      )}
      <div className="p-4 sm:p-5">
        <h2 className="break-words font-display text-xl leading-snug">
          {localizedSchoolField(doc.info, "name", lang)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <SchoolLocation info={doc.info} />
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--beige)]">
          {lang === "en" ? "More details" : c.more}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
