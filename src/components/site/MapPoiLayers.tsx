import { useMemo, type ComponentType } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import {
  Building2,
  ChartNoAxesCombined,
  GraduationCap,
  HeartPulse,
  Instagram,
  Landmark,
  MessageCircle,
  Phone,
  ShoppingBag,
  TentTree,
  Wrench,
  type LucideProps,
} from "lucide-react";
import type { Lang } from "@/lib/i18n";
import {
  displayTerritoryName,
  displayVillageName,
  getOfficialVillage,
  getTerritory,
} from "@/lib/territories-data";
import {
  DATA_URLS,
  POI_LAYERS,
  featureCenter,
  property,
  type GeoJsonCollection,
  type GeoJsonFeature,
  type PoiLayerKey,
  useLazyCollection,
} from "@/lib/kara-kulja-map";

function ReligionFilterIcon({ size = 24, strokeWidth = 1.8, ...props }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19h16" />
      <path d="M7 19v-6.5" />
      <path d="M17 19v-6.5" />
      <path d="M8.5 14.2c.5-2.8 1.8-4.4 3.5-4.4s3 1.6 3.5 4.4" />
      <path d="M9.5 19v-4.2h5V19" />
      <path d="M12 9.8V7" />
      <path d="M14.2 4.2a2.2 2.2 0 1 0 1.7 3.6" />
    </svg>
  );
}

const POI_ICONS: Record<PoiLayerKey, ComponentType<LucideProps>> = {
  education: GraduationCap,
  healthcare: HeartPulse,
  religion: ReligionFilterIcon,
  cultureSport: Landmark,
  tourism: TentTree,
  investment: ChartNoAxesCombined,
  administration: Building2,
  shop: ShoppingBag,
  amenity: Wrench,
};

const POI_MARKER_SVG: Record<PoiLayerKey, string> = {
  education:
    '<path d="M4 10.5 12 6l8 4.5-8 4.5Z"/><path d="M7 12.5v3.8c0 .9 2.2 1.7 5 1.7s5-.8 5-1.7v-3.8"/>',
  healthcare:
    '<path d="M12 5v14"/><path d="M5 12h14"/><path d="M7.5 4.5h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"/>',
  religion:
    '<path d="M4 19h16"/><path d="M7 19v-6.5"/><path d="M17 19v-6.5"/><path d="M8.5 14.2c.5-2.8 1.8-4.4 3.5-4.4s3 1.6 3.5 4.4"/><path d="M9.5 19v-4.2h5V19"/><path d="M12 9.8V7"/><path d="M14.2 4.2a2.2 2.2 0 1 0 1.7 3.6"/>',
  cultureSport:
    '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 9 5H3Z"/>',
  tourism: '<path d="m3 19 6-10 4 7 2-3 6 6Z"/><path d="m8.5 12 1.5 1.5 1.5-1.5"/>',
  investment: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/><path d="M17 7h3v3"/>',
  administration:
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8"/><path d="M18 9h2a2 2 0 0 1 2 2v11"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  shop: '<path d="M5 10h14l-1-5H6Z"/><path d="M7 10v9h10v-9"/><path d="M10 19v-4h4v4"/>',
  amenity:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.2-3.2a5.2 5.2 0 0 1-6.9 6.9l-6.2 6.2a2 2 0 0 1-2.8-2.8l6.2-6.2a5.2 5.2 0 0 1 6.9-6.9Z"/>',
};

const POI_POPUP_COPY = {
  kg: {
    unnamed: "Аталышы жок объект",
    category: "Категория",
    website: "Веб-сайт",
    phone: "Телефон",
    open: "Ачуу",
  },
  ru: {
    unnamed: "Объект без названия",
    category: "Категория",
    website: "Сайт",
    phone: "Телефон",
    open: "Открыть",
  },
  en: {
    unnamed: "Unnamed POI",
    category: "Category",
    website: "Website",
    phone: "Phone",
    open: "Open",
  },
};

export function usePoiCollections(filters: Record<PoiLayerKey, boolean>) {
  const education = useLazyCollection(DATA_URLS.pois.education, filters.education);
  const healthcare = useLazyCollection(DATA_URLS.pois.healthcare, filters.healthcare);
  const religion = useLazyCollection(DATA_URLS.pois.religion, filters.religion);
  const cultureSport = useLazyCollection(DATA_URLS.pois.cultureSport, filters.cultureSport);
  const tourism = useLazyCollection(DATA_URLS.pois.tourism, filters.tourism);
  const investment = useLazyCollection(DATA_URLS.pois.investment, filters.investment);
  const administration = useLazyCollection(DATA_URLS.pois.administration, filters.administration);
  const shop = useLazyCollection(DATA_URLS.pois.shop, filters.shop);
  const amenity = useLazyCollection(DATA_URLS.pois.amenity, filters.amenity);

  return useMemo(
    () => ({
      education,
      healthcare,
      religion,
      cultureSport,
      tourism,
      investment,
      administration,
      shop,
      amenity,
    }),
    [
      administration,
      amenity,
      cultureSport,
      education,
      healthcare,
      investment,
      religion,
      shop,
      tourism,
    ],
  );
}

export function usePoiMarkerIcons() {
  return useMemo(
    () =>
      Object.fromEntries(
        POI_LAYERS.map((layer) => [layer.key, createPoiMarkerIcon(layer.key, layer.color)]),
      ) as Record<PoiLayerKey, L.DivIcon>,
    [],
  );
}

export function PoiFilterPanel({
  filters,
  lang,
  onToggle,
  compact = false,
}: {
  filters: Record<PoiLayerKey, boolean>;
  lang: Lang;
  onToggle: (key: PoiLayerKey) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`kara-map-filter-panel${compact ? " village-map-filter-panel" : ""}`}
      aria-label="Optional map layers"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {POI_LAYERS.map((layer) => {
        const Icon = POI_ICONS[layer.key];
        const label = layer.label[lang];

        return (
          <button
            key={layer.key}
            type="button"
            className="kara-map-filter-button"
            data-active={filters[layer.key] ? "true" : "false"}
            aria-label={label}
            aria-pressed={filters[layer.key]}
            title={label}
            onClick={() => onToggle(layer.key)}
          >
            <Icon aria-hidden="true" strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PoiMarkers({
  collections,
  filters,
  icons,
  lang,
}: {
  collections: Record<PoiLayerKey, GeoJsonCollection | null>;
  filters: Record<PoiLayerKey, boolean>;
  icons: Record<PoiLayerKey, L.DivIcon>;
  lang: Lang;
}) {
  return (
    <>
      {POI_LAYERS.map((layer) => {
        const collection = collections[layer.key];
        if (!filters[layer.key] || !collection) return null;

        return collection.features.map((feature, index) => {
          const poiFeature = feature as GeoJsonFeature;
          const position = featureCenter(poiFeature);
          if (!position) return null;

          const name = poiDisplayName(poiFeature, lang);
          const location = poiLocation(poiFeature, lang);
          const contacts = poiContacts(poiFeature, lang);
          const copy = POI_POPUP_COPY[lang];

          return (
            <Marker
              key={`${layer.key}-${property(poiFeature, "@id") || index}`}
              position={position}
              icon={icons[layer.key]}
            >
              <Popup className="kara-map-poi-popup" maxWidth={260}>
                <div className="kara-map-poi-popup-content">
                  <strong>{name || copy.unnamed}</strong>
                  {location ? <p className="kara-map-poi-location">{location}</p> : null}
                  <p className="kara-map-poi-category">
                    {copy.category}: {layer.label[lang]}
                  </p>
                  <div className="kara-map-poi-actions">
                    {contacts.map((contact) => (
                      <div
                        key={contact.kind}
                        className="kara-map-poi-contact"
                        data-active={contact.href ? "true" : "false"}
                        data-kind={contact.kind}
                      >
                        <div
                          className="kara-map-poi-contact-icon"
                          role="img"
                          aria-label={contact.label}
                        >
                          <PoiContactIcon kind={contact.kind} />
                        </div>
                        {contact.href ? (
                          <a
                            href={contact.href}
                            aria-label={`${contact.label}: ${contact.value}`}
                            target={contact.external ? "_blank" : undefined}
                            rel={contact.external ? "noopener noreferrer" : undefined}
                          >
                            {contact.value}
                          </a>
                        ) : (
                          <span
                            className="kara-map-poi-contact-value"
                            aria-label={`${contact.label}: ${contact.value}`}
                          >
                            {contact.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        });
      })}
    </>
  );
}

type PoiContactKind = "instagram" | "facebook" | "website" | "phone" | "whatsapp";

type PoiContact = {
  kind: PoiContactKind;
  label: string;
  value: string;
  href: string | null;
  external: boolean;
};

function PoiContactIcon({ kind }: { kind: PoiContactKind }) {
  if (kind === "instagram") return <Instagram aria-hidden="true" />;
  if (kind === "facebook") return <FacebookContactIcon />;
  if (kind === "website") return <WebsiteContactIcon />;
  if (kind === "phone") return <Phone aria-hidden="true" />;
  return <MessageCircle aria-hidden="true" />;
}

function FacebookContactIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        stroke="none"
        d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H8v3h2.6v8h3.1Z"
      />
    </svg>
  );
}

function WebsiteContactIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19" />
      <path d="M4.4 7.5h15.2" />
      <path d="M4.4 16.5h15.2" />
      <path d="M12 2.5c3 2.7 4.5 5.8 4.5 9.5S15 18.8 12 21.5" />
      <path d="M12 2.5C9 5.2 7.5 8.3 7.5 12S9 18.8 12 21.5" />
    </svg>
  );
}

function poiDisplayName(feature: GeoJsonFeature, lang: Lang) {
  const localizedProperty = lang === "kg" ? "name:ky" : lang === "ru" ? "name:ru" : "name:en";

  return property(feature, localizedProperty) || property(feature, "name") || "";
}

function poiLocation(feature: GeoJsonFeature, lang: Lang) {
  const villageSlug = property(feature, "villageSlug");
  const territorySlug = property(feature, "territorySlug");
  if (!villageSlug || !territorySlug) return null;

  const village = getOfficialVillage(villageSlug);
  const territory = getTerritory(territorySlug);
  if (!village || !territory || village.territorySlug !== territory.slug) return null;

  const villageName = displayVillageName(village, lang);
  const territoryName = displayTerritoryName(territory, lang);

  if (lang === "ru") return `село ${villageName}, айыл аймак ${territoryName}`;
  if (lang === "en") return `${villageName} village, ${territoryName} Aiyl Aimak`;
  return `${villageName} айылы, ${territoryName} айыл аймагы`;
}

function poiContacts(feature: GeoJsonFeature, lang: Lang): PoiContact[] {
  const copy = POI_POPUP_COPY[lang];
  const contacts: PoiContact[] = [
    externalContact(
      feature,
      ["contact:instagram", "instagram"],
      "instagram",
      "Instagram",
      copy.open,
    ),
    externalContact(feature, ["contact:facebook", "facebook"], "facebook", "Facebook", copy.open),
    externalContact(feature, ["contact:website", "website"], "website", copy.website, copy.open),
  ];

  const phone = firstProperty(feature, ["contact:phone", "phone"]);
  const phoneHref = phone ? telephoneHref(phone) : null;
  contacts.push({
    kind: "phone",
    label: copy.phone,
    value: phoneHref ? firstPhoneNumber(phone) : "---",
    href: phoneHref,
    external: false,
  });

  const whatsapp = firstProperty(feature, ["contact:whatsapp", "whatsapp"]);
  const whatsappHref = whatsapp ? whatsappLink(whatsapp) : null;
  if (whatsappHref) {
    contacts.push({
      kind: "whatsapp",
      label: "WhatsApp",
      value: copy.open,
      href: whatsappHref,
      external: true,
    });
  }

  return contacts;
}

function externalContact(
  feature: GeoJsonFeature,
  keys: string[],
  kind: "instagram" | "facebook" | "website",
  label: string,
  activeLabel: string,
): PoiContact {
  const value = firstProperty(feature, keys);
  const href = value ? externalLink(value, kind === "website" ? undefined : kind) : null;
  return {
    kind,
    label,
    value: href ? activeLabel : "---",
    href,
    external: true,
  };
}

function firstProperty(feature: GeoJsonFeature, keys: string[]) {
  for (const key of keys) {
    const value = property(feature, key)?.trim();
    if (value) return value;
  }
  return null;
}

function externalLink(value: string, service?: "instagram" | "facebook") {
  const direct = safeHttpUrl(value);
  if (direct) return direct;

  const handle = value.replace(/^@/, "");
  if (service && /^[a-zA-Z0-9._-]+$/.test(handle)) {
    return `https://${service}.com/${handle}`;
  }

  return safeHttpUrl(`https://${value}`);
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function firstPhoneNumber(value: string) {
  return value.split(/[;,]/)[0]?.trim() || "";
}

function telephoneHref(value: string) {
  const number = firstPhoneNumber(value).replace(/(?!^\+)[^\d]/g, "");
  return number.replace(/\D/g, "").length >= 7 ? `tel:${number}` : null;
}

function whatsappLink(value: string) {
  const direct = safeHttpUrl(value);
  if (direct) return direct;

  const number = value.replace(/\D/g, "");
  return number.length >= 7 ? `https://wa.me/${number}` : null;
}

function createPoiMarkerIcon(key: PoiLayerKey, color: string) {
  return L.divIcon({
    className: "kara-map-poi-marker",
    html: `<span class="kara-map-poi-marker-shell" style="--poi-color:${color}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${POI_MARKER_SVG[key]}</svg></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -11],
  });
}
