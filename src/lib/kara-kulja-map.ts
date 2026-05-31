import { useEffect, useState } from "react";
import L, { type PathOptions } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { OFFICIAL_VILLAGES } from "@/lib/territories-data";
import type { Lang } from "@/lib/i18n";

export type GeoJsonCollection = FeatureCollection<Geometry, Record<string, unknown>>;
export type GeoJsonFeature = Feature<Geometry, Record<string, unknown>>;
export type PoiLayerKey = "education" | "healthcare" | "religion" | "shop" | "tourism" | "amenity";

export type DistrictMapData = {
  boundary: GeoJsonCollection;
  places: GeoJsonCollection;
  rivers: GeoJsonCollection;
  lakes: GeoJsonCollection;
  roads: GeoJsonCollection;
  context: GeoJsonCollection;
  contextRoads: GeoJsonCollection;
  contextRivers: GeoJsonCollection;
};

export type VillageMapData = {
  places: GeoJsonCollection;
  rivers: GeoJsonCollection;
  roads: GeoJsonCollection;
  lakes: GeoJsonCollection;
  contextRoads: GeoJsonCollection;
  contextRivers: GeoJsonCollection;
};

export const DATA_URLS = {
  boundary: "/data/kara-kulja-boundary.geojson",
  places: "/data/kara-kulja-places.geojson",
  rivers: "/data/kara-kulja-rivers.geojson",
  lakes: "/data/kara-kulja-lakes.geojson",
  roads: "/data/kara-kulja-highways.geojson",
  context: "/data/kara-kulja-context-labels.geojson",
  contextRoads: "/data/kara-kulja-context-roads.geojson",
  contextRivers: "/data/kara-kulja-context-rivers.geojson",
  buildings: "/data/kara-kulja-buildings.geojson",
  pois: {
    education: "/data/kara-kulja-pois-education.geojson",
    healthcare: "/data/kara-kulja-pois-healthcare.geojson",
    religion: "/data/kara-kulja-pois-religion.geojson",
    shop: "/data/kara-kulja-pois-shop.geojson",
    tourism: "/data/kara-kulja-pois-tourism.geojson",
    amenity: "/data/kara-kulja-pois-amenity.geojson",
  },
} as const;

export const DEEP_MAP_MAX_ZOOM = 19;
export const BUILDING_MIN_ZOOM = 16;

export const TERRAIN_HILLSHADE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Hillshade © Esri, USGS, NGA, NASA, CGIAR, and the GIS user community",
  maxNativeZoom: 13,
  opacity: 0.18,
} as const;

export const POI_LAYERS: Array<{
  key: PoiLayerKey;
  color: string;
  label: Record<Lang, string>;
}> = [
  {
    key: "education",
    color: "#8a6d1e",
    label: { kg: "Билим берүү", ru: "Образование", en: "Education" },
  },
  {
    key: "healthcare",
    color: "#9a3d3d",
    label: { kg: "Саламаттык", ru: "Здоровье", en: "Healthcare" },
  },
  {
    key: "religion",
    color: "#6b5c8f",
    label: { kg: "Дин", ru: "Религия", en: "Religion" },
  },
  {
    key: "shop",
    color: "#7c6b4f",
    label: { kg: "Дүкөндөр", ru: "Магазины", en: "Shops" },
  },
  {
    key: "tourism",
    color: "#b36b2c",
    label: { kg: "Туризм", ru: "Туризм", en: "Tourism" },
  },
  {
    key: "amenity",
    color: "#53665d",
    label: { kg: "Кызматтар", ru: "Услуги", en: "Services" },
  },
];

export const DEFAULT_POI_FILTERS = Object.fromEntries(
  POI_LAYERS.map((layer) => [layer.key, false]),
) as Record<PoiLayerKey, boolean>;

const MAIN_ROADS = new Set(["primary", "secondary", "tertiary", "unclassified"]);
const SETTLEMENTS = new Set(["village", "hamlet", "isolated_dwelling"]);
const WATER_BODIES = new Set(["lake", "pond", "reservoir"]);
const CONTEXT_PLACES = new Set(["city", "town", "village"]);
const FILTERED_CONTEXT_TYPES = new Set(["place", "district", "region", "country"]);

const NAME_OVERRIDES: Record<string, string[]> = {
  "birinchi-may": ["Первое Мая", "Pervoye Maya"],
  "zhany-talap": ["Жаны-Талап"],
  "zhany-talaa": ["Жаны-Талаа"],
  "altyn-kurok": ["Алтын-Кюрек"],
  "zhetim-dobo": ["Жетим-Дебе"],
  kenesh: ["Кенеш"],
  "sai-talaa": ["Сай талаа", "Say-Talaa"],
  "boru-tokoy": ["Бору-Токой", "Bory-Tokoy"],
  "kaiyn-talaa": ["Кайың-Талаа", "Kaying-Talaa"],
  konduk: ["Көндүк", "Köndük", "Кондук"],
  "konokbay-talaa": ["Конобай-Талаа"],
  "sary-tash": ["Сары-Таш"],
};

const MANUAL_VERIFIED_VILLAGES: Record<string, { lat: number; lng: number; source: string }> = {
  "biy-myrza": { lat: 40.635082, lng: 73.571576, source: "2GIS verified" },
  kuyotash: { lat: 40.319857, lng: 74.239662, source: "2GIS verified" },
  "kan-korgon": { lat: 40.267859, lng: 74.312366, source: "2GIS verified" },
  sharkyratma: { lat: 40.54079, lng: 73.647869, source: "2GIS verified" },
  "kyzyl-bulak": { lat: 40.44267, lng: 73.59476, source: "2GIS verified" },
};

const CONTEXT_LABEL_NAMES = new Set(
  [
    "Өзгөн району",
    "Узгенский район",
    "Uzgen District",
    "Алай району",
    "Алайский район",
    "Alay District",
    "Ош облусу",
    "Ошская область",
    "Osh Region",
    "Өзгөн",
    "Узген",
    "Uzgen",
    "Мырза-Аке",
    "Мырза-Аки",
    "Myrza-Ake",
    "Гүлчө",
    "Гульча",
    "Gulcho",
    "Кытай",
    "Китай",
    "China",
  ].map(normalizeName),
);

export function property(feature: GeoJsonFeature, key: string) {
  const value = feature.properties?.[key];
  return typeof value === "string" ? value : undefined;
}

export function featureName(feature: GeoJsonFeature) {
  return (
    property(feature, "name:en") ||
    property(feature, "name") ||
    property(feature, "name:ru") ||
    property(feature, "name:ky") ||
    ""
  );
}

export function filterCollection(
  collection: GeoJsonCollection,
  predicate: (feature: GeoJsonFeature) => boolean,
): GeoJsonCollection {
  return {
    ...collection,
    features: collection.features.filter(predicate),
  };
}

export function normalizeName(name: string) {
  return name
    .toLocaleLowerCase("ky-KG")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function namesForFeature(feature: GeoJsonFeature) {
  return [
    property(feature, "name"),
    property(feature, "name:ky"),
    property(feature, "name:ru"),
    property(feature, "name:en"),
  ].filter((name): name is string => Boolean(name));
}

function officialNameKeys(village: (typeof OFFICIAL_VILLAGES)[number]) {
  return [
    village.name,
    village.nameRu,
    village.nameEn,
    ...(NAME_OVERRIDES[village.slug] || []),
  ].map(normalizeName);
}

export function matchOfficialPlaces(places: GeoJsonCollection): GeoJsonCollection {
  const candidates = places.features.filter(
    (feature) =>
      feature.geometry.type === "Point" &&
      SETTLEMENTS.has(property(feature, "place") || ""),
  );

  const used = new Set<number>();
  const matched = OFFICIAL_VILLAGES.flatMap((village) => {
    const keys = new Set(officialNameKeys(village));
    const index = candidates.findIndex((feature, candidateIndex) => {
      if (used.has(candidateIndex)) return false;
      return namesForFeature(feature).some((name) => keys.has(normalizeName(name)));
    });

    if (index === -1) {
      const manual = MANUAL_VERIFIED_VILLAGES[village.slug];
      if (!manual) return [];

      return [
        {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [manual.lng, manual.lat],
          },
          properties: {
            "@id": `manual/${village.slug}`,
            name: village.name,
            "name:en": village.nameEn,
            "name:ru": village.nameRu,
            place: "village",
            officialSlug: village.slug,
            coordinateSource: manual.source,
            source: manual.source,
          },
        },
      ];
    }

    used.add(index);
    const source = candidates[index];

    return [
      {
        ...source,
        properties: {
          ...source.properties,
          name: village.name,
          "name:en": village.nameEn,
          "name:ru": village.nameRu,
          officialSlug: village.slug,
          osmName: featureName(source),
        },
      },
    ];
  });

  return {
    ...places,
    features: matched,
  };
}

export function contextFeatureType(feature: GeoJsonFeature) {
  const contextType = property(feature, "contextType");
  if (contextType && FILTERED_CONTEXT_TYPES.has(contextType)) {
    return contextType;
  }

  const boundary = property(feature, "boundary");
  const adminLevel = property(feature, "admin_level");
  const place = property(feature, "place");

  if (boundary === "administrative" && (adminLevel === "4" || adminLevel === "6")) {
    return adminLevel === "4" ? "region" : "district";
  }

  if (place && CONTEXT_PLACES.has(place)) {
    return "place";
  }

  return "";
}

export function matchContextLabels(context: GeoJsonCollection): GeoJsonCollection {
  return filterCollection(context, (feature) => {
    const type = contextFeatureType(feature);
    if (!type) return false;
    if (property(feature, "contextType")) return true;

    return namesForFeature(feature).some((name) =>
      CONTEXT_LABEL_NAMES.has(normalizeName(name)),
    );
  });
}

export function contextName(feature: GeoJsonFeature, lang: Lang) {
  if (lang === "ru") {
    return property(feature, "name:ru") || property(feature, "name") || featureName(feature);
  }

  if (lang === "en") {
    return property(feature, "name:en") || property(feature, "name") || featureName(feature);
  }

  return property(feature, "name:ky") || property(feature, "name") || featureName(feature);
}

export function featureCenter(feature: GeoJsonFeature): [number, number] | null {
  if (feature.geometry.type === "Point") {
    const [lng, lat] = feature.geometry.coordinates;
    return [lat, lng];
  }

  const bounds = L.geoJSON(feature).getBounds();
  if (!bounds.isValid()) return null;

  const center = bounds.getCenter();
  return [center.lat, center.lng];
}

export async function loadCollection(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}`);
  }
  return (await response.json()) as GeoJsonCollection;
}

export function useLazyCollection(url: string, enabled: boolean) {
  const [data, setData] = useState<GeoJsonCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || data || error) return;

    let alive = true;

    loadCollection(url)
      .then((collection) => {
        if (alive) setData(collection);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Unable to load optional map layer");
      });

    return () => {
      alive = false;
    };
  }, [data, enabled, error, url]);

  return data;
}

export function useDistrictMapData() {
  const [data, setData] = useState<DistrictMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.all([
      loadCollection(DATA_URLS.boundary),
      loadCollection(DATA_URLS.places),
      loadCollection(DATA_URLS.rivers),
      loadCollection(DATA_URLS.lakes),
      loadCollection(DATA_URLS.roads),
      loadCollection(DATA_URLS.context),
      loadCollection(DATA_URLS.contextRoads),
      loadCollection(DATA_URLS.contextRivers),
    ])
      .then(([boundary, places, rivers, lakes, roads, context, contextRoads, contextRivers]) => {
        if (!alive) return;

        setData({
          boundary: filterCollection(
            boundary,
            (feature) => property(feature, "admin_level") === "6",
          ),
          places: matchOfficialPlaces(places),
          rivers: filterCollection(rivers, (feature) =>
            ["river", "stream"].includes(property(feature, "waterway") || ""),
          ),
          lakes: filterCollection(lakes, (feature) =>
            WATER_BODIES.has(property(feature, "water") || ""),
          ),
          roads: filterCollection(roads, (feature) =>
            MAIN_ROADS.has(property(feature, "highway") || ""),
          ),
          context: matchContextLabels(context),
          contextRoads: filterCollection(contextRoads, (feature) =>
            ["motorway", "trunk", "primary", "secondary"].includes(
              property(feature, "highway") || "",
            ),
          ),
          contextRivers: filterCollection(
            contextRivers,
            (feature) => property(feature, "waterway") === "river",
          ),
        });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Unable to load map data");
      });

    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}

export function useVillageMapData() {
  const [data, setData] = useState<VillageMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.all([
      loadCollection(DATA_URLS.places),
      loadCollection(DATA_URLS.rivers),
      loadCollection(DATA_URLS.lakes),
      loadCollection(DATA_URLS.roads),
      loadCollection(DATA_URLS.contextRoads),
      loadCollection(DATA_URLS.contextRivers),
    ])
      .then(([places, rivers, lakes, roads, contextRoads, contextRivers]) => {
        if (!alive) return;

        setData({
          places: matchOfficialPlaces(places),
          rivers: filterCollection(rivers, (feature) =>
            ["river", "stream"].includes(property(feature, "waterway") || ""),
          ),
          lakes: filterCollection(lakes, (feature) =>
            WATER_BODIES.has(property(feature, "water") || ""),
          ),
          roads: filterCollection(roads, (feature) =>
            MAIN_ROADS.has(property(feature, "highway") || ""),
          ),
          contextRoads: filterCollection(contextRoads, (feature) =>
            ["motorway", "trunk", "primary", "secondary"].includes(
              property(feature, "highway") || "",
            ),
          ),
          contextRivers: filterCollection(
            contextRivers,
            (feature) => property(feature, "waterway") === "river",
          ),
        });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Unable to load village map data");
      });

    return () => {
      alive = false;
    };
  }, []);

  return { data, error };
}

export function distanceKm(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearbyCollection(
  collection: GeoJsonCollection,
  center: [number, number],
  radiusKm: number,
): GeoJsonCollection {
  return filterCollection(collection, (feature) => {
    const featurePosition = featureCenter(feature);
    if (!featurePosition) return false;
    return distanceKm(center, featurePosition) <= radiusKm;
  });
}

export function roadStyle(feature?: GeoJsonFeature): PathOptions {
  const highway = feature ? property(feature, "highway") : undefined;

  return {
    color: "#d0d0cc",
    opacity: highway === "primary" || highway === "secondary" ? 0.95 : 0.72,
    weight: highway === "primary" ? 3.8 : highway === "secondary" ? 3 : 2,
    lineCap: "round",
    lineJoin: "round",
  };
}

export function contextRoadStyle(feature?: GeoJsonFeature): PathOptions {
  const highway = feature ? property(feature, "highway") : undefined;

  return {
    color: "#cfcfca",
    opacity: highway === "motorway" || highway === "trunk" ? 0.36 : 0.26,
    weight: highway === "motorway" || highway === "trunk" ? 2.1 : 1.55,
    lineCap: "round",
    lineJoin: "round",
  };
}

export function riverStyle(feature?: GeoJsonFeature): PathOptions {
  const waterway = feature ? property(feature, "waterway") : undefined;

  return {
    color: "#2f8fc4",
    opacity: waterway === "river" ? 0.92 : 0.54,
    weight: waterway === "river" ? 2.4 : 1.1,
    lineCap: "round",
    lineJoin: "round",
  };
}

export function contextRiverStyle(): PathOptions {
  return {
    color: "#8fc8df",
    opacity: 0.34,
    weight: 1.15,
    lineCap: "round",
    lineJoin: "round",
  };
}

export function lakeStyle(): PathOptions {
  return {
    color: "#247faf",
    fillColor: "#78bde0",
    fillOpacity: 0.58,
    opacity: 0.9,
    weight: 1.2,
  };
}

export function buildingStyle(): PathOptions {
  return {
    color: "#938b79",
    fillColor: "#c7bea9",
    fillOpacity: 0.2,
    opacity: 0.28,
    weight: 0.55,
  };
}

export function boundaryStyle(): PathOptions {
  return {
    color: "#123f2a",
    fillColor: "#efe5cf",
    fillOpacity: 0.12,
    opacity: 1,
    weight: 3.4,
    dashArray: "8 6",
  };
}

export function poiStyle(color: string): PathOptions {
  return {
    color,
    fillColor: color,
    fillOpacity: 0.18,
    opacity: 0.7,
    weight: 1,
  };
}

export function bindFeatureTooltip(layer: L.Layer, feature: GeoJsonFeature, fallback: string) {
  const name = featureName(feature);
  if (!name) return;

  layer.bindTooltip(name, {
    direction: "top",
    sticky: true,
    className: `kara-map-hover-label ${fallback}`,
  });
}

export function bindPoiTooltip(layer: L.Layer, feature: GeoJsonFeature, fallback: string) {
  const name =
    featureName(feature) ||
    property(feature, "amenity") ||
    property(feature, "shop") ||
    property(feature, "tourism") ||
    property(feature, "healthcare") ||
    property(feature, "religion") ||
    fallback;

  if (!name) return;

  layer.bindTooltip(name, {
    direction: "top",
    sticky: true,
    className: "kara-map-hover-label poi",
  });
}
