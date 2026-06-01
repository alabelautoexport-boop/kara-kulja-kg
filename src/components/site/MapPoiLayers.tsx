import { useMemo, type ComponentType } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import {
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  TentTree,
  Wrench,
  type LucideProps,
} from "lucide-react";
import type { Lang } from "@/lib/i18n";
import {
  DATA_URLS,
  POI_LAYERS,
  featureCenter,
  featureName,
  property,
  type GeoJsonCollection,
  type GeoJsonFeature,
  type PoiLayerKey,
  useLazyCollection,
} from "@/lib/kara-kulja-map";

function ReligionFilterIcon({
  size = 24,
  strokeWidth = 1.8,
  ...props
}: LucideProps) {
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
  shop: ShoppingBag,
  tourism: TentTree,
  amenity: Wrench,
};

const POI_MARKER_SVG: Record<PoiLayerKey, string> = {
  tourism:
    '<path d="m3 19 6-10 4 7 2-3 6 6Z"/><path d="m8.5 12 1.5 1.5 1.5-1.5"/>',
  education:
    '<path d="M4 10.5 12 6l8 4.5-8 4.5Z"/><path d="M7 12.5v3.8c0 .9 2.2 1.7 5 1.7s5-.8 5-1.7v-3.8"/>',
  healthcare:
    '<path d="M12 5v14"/><path d="M5 12h14"/><path d="M7.5 4.5h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"/>',
  religion:
    '<path d="M4 19h16"/><path d="M7 19v-6.5"/><path d="M17 19v-6.5"/><path d="M8.5 14.2c.5-2.8 1.8-4.4 3.5-4.4s3 1.6 3.5 4.4"/><path d="M9.5 19v-4.2h5V19"/><path d="M12 9.8V7"/><path d="M14.2 4.2a2.2 2.2 0 1 0 1.7 3.6"/>',
  shop:
    '<path d="M5 10h14l-1-5H6Z"/><path d="M7 10v9h10v-9"/><path d="M10 19v-4h4v4"/>',
  amenity:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.2-3.2a5.2 5.2 0 0 1-6.9 6.9l-6.2 6.2a2 2 0 0 1-2.8-2.8l6.2-6.2a5.2 5.2 0 0 1 6.9-6.9Z"/>',
};

const POI_POPUP_COPY = {
  kg: {
    unnamed: "Аталышы жок объект",
    category: "Категория",
    tags: "OSM тегдери",
  },
  ru: {
    unnamed: "Объект без названия",
    category: "Категория",
    tags: "OSM-теги",
  },
  en: {
    unnamed: "Unnamed POI",
    category: "Category",
    tags: "OSM tags",
  },
};

export function usePoiCollections(filters: Record<PoiLayerKey, boolean>) {
  const education = useLazyCollection(DATA_URLS.pois.education, filters.education);
  const healthcare = useLazyCollection(DATA_URLS.pois.healthcare, filters.healthcare);
  const religion = useLazyCollection(DATA_URLS.pois.religion, filters.religion);
  const shop = useLazyCollection(DATA_URLS.pois.shop, filters.shop);
  const tourism = useLazyCollection(DATA_URLS.pois.tourism, filters.tourism);
  const amenity = useLazyCollection(DATA_URLS.pois.amenity, filters.amenity);

  return useMemo(
    () => ({
      education,
      healthcare,
      religion,
      shop,
      tourism,
      amenity,
    }),
    [amenity, education, healthcare, religion, shop, tourism],
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

          const name = poiDisplayName(poiFeature);
          const tags = primitivePropertyEntries(poiFeature);
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
                  <p>
                    {copy.category}: {layer.label[lang]}
                  </p>
                  {tags.length ? (
                    <div>
                      <span>{copy.tags}</span>
                      <dl>
                        {tags.map(([key, value]) => (
                          <div key={key}>
                            <dt>{key}</dt>
                            <dd>{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        });
      })}
    </>
  );
}

function primitivePropertyEntries(feature: GeoJsonFeature) {
  return Object.entries(feature.properties || {})
    .filter((entry): entry is [string, string | number | boolean] => {
      const [, value] = entry;
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      );
    })
    .filter(([, value]) => String(value).trim().length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
}

function poiDisplayName(feature: GeoJsonFeature) {
  return (
    featureName(feature) ||
    property(feature, "amenity") ||
    property(feature, "shop") ||
    property(feature, "tourism") ||
    property(feature, "healthcare") ||
    property(feature, "religion") ||
    ""
  );
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
