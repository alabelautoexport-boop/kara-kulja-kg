import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import L from "leaflet";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Tooltip,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OFFICIAL_VILLAGES, displayVillageName } from "@/lib/territories-data";
import { useI18n } from "@/lib/i18n";
import {
  PoiFilterPanel,
  PoiMarkers,
  usePoiCollections,
  usePoiMarkerIcons,
} from "@/components/site/MapPoiLayers";
import {
  BUILDING_MIN_ZOOM,
  DATA_URLS,
  DEEP_MAP_MAX_ZOOM,
  DEFAULT_POI_FILTERS,
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
  useDistrictMapData,
  useLazyCollection,
} from "@/lib/kara-kulja-map";

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

function FitDistrictBounds({ boundary }: { boundary: GeoJsonCollection }) {
  const map = useMap();

  useEffect(() => {
    const layer = L.geoJSON(boundary);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      const width = map.getSize().x;
      const isMobile = width < 640;
      const isLaptop = width < 1024;

      map.fitBounds(bounds.pad(isMobile ? 0.05 : 0.04), {
        padding: isMobile ? [14, 14] : [20, 20],
        maxZoom: isMobile ? 9.25 : isLaptop ? 9.5 : 9.75,
      });
    }
  }, [boundary, map]);

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
  const poiCollections = usePoiCollections(poiFilters);

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

  const poiMarkerIcons = usePoiMarkerIcons();

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
          <FitDistrictBounds boundary={data.boundary} />
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

          <PoiMarkers
            collections={poiCollections}
            filters={poiFilters}
            icons={poiMarkerIcons}
            lang={lang}
          />

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

        <PoiFilterPanel
          filters={poiFilters}
          lang={lang}
          onToggle={(key) =>
            setPoiFilters((current) => ({
              ...current,
              [key]: !current[key],
            }))
          }
        />
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
