import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate } from "@tanstack/react-router";
import L from "leaflet";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  Tooltip,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CircleEllipsis,
  GraduationCap,
  HeartPulse,
  Landmark,
  ShoppingBag,
  TentTree,
  type LucideProps,
} from "lucide-react";
import { OFFICIAL_VILLAGES, displayVillageName } from "@/lib/territories-data";
import { useI18n } from "@/lib/i18n";
import {
  BUILDING_MIN_ZOOM,
  DATA_URLS,
  DEEP_MAP_MAX_ZOOM,
  DEFAULT_POI_FILTERS,
  POI_LAYERS,
  TERRAIN_HILLSHADE,
  bindFeatureTooltip,
  boundaryStyle,
  buildingStyle,
  contextFeatureType,
  contextName,
  contextRiverStyle,
  contextRoadStyle,
  featureCenter,
  featureName,
  lakeStyle,
  property,
  riverStyle,
  roadStyle,
  type GeoJsonCollection,
  type GeoJsonFeature,
  type PoiLayerKey,
  useDistrictMapData,
  useLazyCollection,
} from "@/lib/kara-kulja-map";

const POI_ICONS: Record<PoiLayerKey, ComponentType<LucideProps>> = {
  education: GraduationCap,
  healthcare: HeartPulse,
  religion: Landmark,
  shop: ShoppingBag,
  tourism: TentTree,
  amenity: CircleEllipsis,
};

const POI_MARKER_SVG: Record<PoiLayerKey, string> = {
  tourism:
    '<path d="m3 19 6-10 4 7 2-3 6 6Z"/><path d="m8.5 12 1.5 1.5 1.5-1.5"/>',
  education:
    '<path d="M4 10.5 12 6l8 4.5-8 4.5Z"/><path d="M7 12.5v3.8c0 .9 2.2 1.7 5 1.7s5-.8 5-1.7v-3.8"/>',
  healthcare:
    '<path d="M12 5v14"/><path d="M5 12h14"/><path d="M7.5 4.5h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"/>',
  religion:
    '<path d="M4 19h16"/><path d="M7 19V9.5"/><path d="M17 19V9.5"/><path d="M6 9.5h2"/><path d="M16 9.5h2"/><path d="M9 19v-5.3a3 3 0 0 1 6 0V19"/><path d="M8 12.5c.7-2.6 2-4 4-4s3.3 1.4 4 4"/><path d="M12 7V4.5"/><path d="M12 4.5c.7.1 1.2.5 1.5 1"/>',
  shop:
    '<path d="M5 10h14l-1-5H6Z"/><path d="M7 10v9h10v-9"/><path d="M10 19v-4h4v4"/>',
  amenity:
    '<path d="M4 15.5h4.2l3.2 1.6a3 3 0 0 0 2.4.1L20 14"/><path d="M8.3 12.5h4.9a1.6 1.6 0 0 1 0 3.2h-3"/><path d="M4 12v6"/><circle cx="15" cy="7" r="2.1"/><path d="M15 3.5v1"/><path d="M15 9.5v1"/><path d="M11.5 7h1"/><path d="M17.5 7h1"/><path d="m12.5 4.5.7.7"/><path d="m16.8 8.8.7.7"/><path d="m17.5 4.5-.7.7"/><path d="m13.2 8.8-.7.7"/>',
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

const MAP_LEGEND_LABELS = {
  kg: {
    boundary: "Райондун чек арасы",
    water: "Дарыялар жана көлдөр",
    roads: "Негизги жолдор",
    settlements: "Айылдар",
  },
  ru: {
    boundary: "Граница района",
    water: "Реки и озёра",
    roads: "Основные дороги",
    settlements: "Сёла",
  },
  en: {
    boundary: "District boundary",
    water: "Rivers and lakes",
    roads: "Main roads",
    settlements: "Settlements",
  },
};

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

function FitDistrictBounds({
  boundary,
  context,
}: {
  boundary: GeoJsonCollection;
  context: GeoJsonCollection;
}) {
  const map = useMap();

  useEffect(() => {
    const layer = L.geoJSON(boundary);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      const isCompact = map.getSize().x < 640;

      context.features.forEach((feature) => {
        if (feature.geometry.type !== "Point") return;

        const [lng, lat] = feature.geometry.coordinates;
        const type = property(feature, "contextType");
        const isNearbyContext =
          lng >= (isCompact ? 73.1 : 72.55) &&
          lng <= 75 &&
          lat >= 39.85 &&
          lat <= 41.05 &&
          type !== "region";

        if (isNearbyContext) {
          bounds.extend([lat, lng]);
        }
      });

      map.fitBounds(bounds.pad(0.18), {
        padding: [34, 34],
      });
    }
  }, [boundary, context, map]);

  return null;
}

function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export function KaraKuljaDistrictMap() {
  const { data, error } = useDistrictMapData();
  const { lang } = useI18n();
  const legendLabels = MAP_LEGEND_LABELS[lang];
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(9);
  const [poiFilters, setPoiFilters] = useState(DEFAULT_POI_FILTERS);

  const buildings = useLazyCollection(DATA_URLS.buildings, zoom >= BUILDING_MIN_ZOOM);
  const educationPois = useLazyCollection(DATA_URLS.pois.education, poiFilters.education);
  const healthcarePois = useLazyCollection(DATA_URLS.pois.healthcare, poiFilters.healthcare);
  const religionPois = useLazyCollection(DATA_URLS.pois.religion, poiFilters.religion);
  const shopPois = useLazyCollection(DATA_URLS.pois.shop, poiFilters.shop);
  const tourismPois = useLazyCollection(DATA_URLS.pois.tourism, poiFilters.tourism);
  const amenityPois = useLazyCollection(DATA_URLS.pois.amenity, poiFilters.amenity);

  const poiCollections: Record<PoiLayerKey, GeoJsonCollection | null> = {
    education: educationPois,
    healthcare: healthcarePois,
    religion: religionPois,
    shop: shopPois,
    tourism: tourismPois,
    amenity: amenityPois,
  };

  const settlementPoints = useMemo(() => {
    if (!data) return [];

    return data.places.features
      .map((feature) => {
        if (feature.geometry.type !== "Point") return null;
        const [lng, lat] = feature.geometry.coordinates;
        const officialSlug = property(feature, "officialSlug");
        if (!officialSlug) return null;

        const officialVillage = OFFICIAL_VILLAGES.find((village) => village.slug === officialSlug);

        return {
          id: property(feature, "@id") || `${lng}-${lat}`,
          name: officialVillage ? displayVillageName(officialVillage, lang) : featureName(feature),
          place: property(feature, "place") || "village",
          position: [lat, lng] as [number, number],
          slug: officialSlug,
        };
      })
      .filter((point): point is NonNullable<typeof point> => Boolean(point?.name && point.slug));
  }, [data, lang]);

  const contextLabels = useMemo(() => {
    if (!data) return [];

    return data.context.features
      .map((feature) => {
        const position = featureCenter(feature);
        const name = contextName(feature, lang);
        const type = contextFeatureType(feature);

        if (!position || !name || !type) return null;

        return {
          id: property(feature, "@id") || `${name}-${position.join(",")}`,
          name,
          position,
          type,
        };
      })
      .filter((label): label is NonNullable<typeof label> => Boolean(label));
  }, [data, lang]);

  const contextIcon = useMemo(
    () =>
      L.divIcon({
        className: "kara-map-context-anchor",
        html: "",
        iconSize: [1, 1],
      }),
    [],
  );

  const poiMarkerIcons = useMemo(
    () =>
      Object.fromEntries(
        POI_LAYERS.map((layer) => [layer.key, createPoiMarkerIcon(layer.key, layer.color)]),
      ) as Record<PoiLayerKey, L.DivIcon>,
    [],
  );

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#efe5cf] px-6 text-center text-sm text-[#26352d]">
        Map data could not be loaded.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-[#efe5cf] px-6 text-sm text-[#26352d]">
        Loading map...
      </div>
    );
  }

  return (
    <div className="kara-district-map w-full overflow-hidden border hairline bg-[#efe5cf]">
      <div className="relative">
        <MapContainer
          center={[40.5, 73.9]}
          zoom={9}
          minZoom={8}
          maxZoom={DEEP_MAP_MAX_ZOOM}
          scrollWheelZoom
          touchZoom
          zoomAnimation
          markerZoomAnimation
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={90}
          inertia
          easeLinearity={0.18}
          attributionControl={false}
          preferCanvas
          className="h-[68vh] min-h-[460px] w-full md:h-[72vh]"
        >
          <FitDistrictBounds boundary={data.boundary} context={data.context} />
          <ZoomWatcher onZoomChange={setZoom} />

          <TileLayer
            url={TERRAIN_HILLSHADE.url}
            opacity={TERRAIN_HILLSHADE.opacity}
            maxNativeZoom={TERRAIN_HILLSHADE.maxNativeZoom}
            maxZoom={DEEP_MAP_MAX_ZOOM}
            className="kara-map-hillshade-layer"
          />

          <GeoJSON
            data={data.contextRoads}
            style={(feature) => contextRoadStyle(feature as GeoJsonFeature)}
            interactive={false}
          />
          <GeoJSON
            data={data.contextRivers}
            style={contextRiverStyle}
            interactive={false}
          />

          {contextLabels.map((label) => (
            <Marker
              key={label.id}
              position={label.position}
              icon={contextIcon}
              interactive={false}
            >
              <Tooltip
                permanent
                direction="center"
                opacity={1}
                className={`kara-map-context-label ${label.type}`}
              >
                {label.name}
              </Tooltip>
            </Marker>
          ))}

          <GeoJSON
            data={data.roads}
            style={(feature) => roadStyle(feature as GeoJsonFeature)}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "road")
            }
          />
          <GeoJSON
            data={data.rivers}
            style={(feature) => riverStyle(feature as GeoJsonFeature)}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "river")
            }
          />
          <GeoJSON
            data={data.lakes}
            style={lakeStyle}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "lake")
            }
          />

          {zoom >= BUILDING_MIN_ZOOM && buildings ? (
            <GeoJSON data={buildings} style={buildingStyle} interactive={false} />
          ) : null}

          <GeoJSON data={data.boundary} style={boundaryStyle} />

          {POI_LAYERS.map((layer) => {
            const collection = poiCollections[layer.key];
            if (!poiFilters[layer.key] || !collection) return null;

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
                  icon={poiMarkerIcons[layer.key]}
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

          {settlementPoints.map((point) => (
            <CircleMarker
              key={point.id}
              center={point.position}
              radius={point.place === "village" ? 4.5 : 3.2}
              eventHandlers={{
                click: () =>
                  navigate({
                    to: "/villages/$slug",
                    params: { slug: point.slug },
                  }),
              }}
              pathOptions={{
                color: "#123f2a",
                fillColor: "#123f2a",
                fillOpacity: 0.88,
                opacity: 0.95,
                weight: 1,
              }}
            >
              <Tooltip
                permanent
                direction="right"
                offset={[8, 0]}
                interactive
                eventHandlers={{
                  click: () =>
                    navigate({
                      to: "/villages/$slug",
                      params: { slug: point.slug },
                    }),
                }}
                className={`kara-map-settlement-label ${point.place}`}
              >
                {point.name}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>

        <div
          className="kara-map-filter-panel"
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
                data-active={poiFilters[layer.key] ? "true" : "false"}
                aria-label={label}
                aria-pressed={poiFilters[layer.key]}
                title={label}
                onClick={() =>
                  setPoiFilters((current) => ({
                    ...current,
                    [layer.key]: !current[layer.key],
                  }))
                }
              >
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t hairline bg-background/95 px-4 py-4">
        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-7 border-2 border-dashed border-[#123f2a]" />
            {legendLabels.boundary}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1 w-7 rounded-full bg-[#2f8fc4]" />
            {legendLabels.water}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1 w-7 rounded-full bg-[#d0d0cc]" />
            {legendLabels.roads}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#123f2a]" />
            {legendLabels.settlements}
          </div>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/55">
          Map data © OpenStreetMap contributors. {TERRAIN_HILLSHADE.attribution}.
        </p>
      </div>
    </div>
  );
}
