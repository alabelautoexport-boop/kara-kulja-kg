import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { ArrowRight, MapPin } from "lucide-react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  OFFICIAL_VILLAGES,
  displayVillageName,
} from "@/lib/territories-data";
import { useI18n } from "@/lib/i18n";
import {
  BUILDING_MIN_ZOOM,
  DATA_URLS,
  DEEP_MAP_MAX_ZOOM,
  bindFeatureTooltip,
  buildingStyle,
  contextRiverStyle,
  contextRoadStyle,
  distanceKm,
  lakeStyle,
  nearbyCollection,
  property,
  riverStyle,
  roadStyle,
  type GeoJsonCollection,
  type GeoJsonFeature,
  useLazyCollection,
  useVillageMapData,
} from "@/lib/kara-kulja-map";

type VillagePoint = {
  id: string;
  name: string;
  position: [number, number];
  slug: string;
};

function FitVillageMap({
  center,
  points,
}: {
  center: [number, number];
  points: VillagePoint[];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([center]);
    points.forEach((point) => bounds.extend(point.position));

    map.fitBounds(bounds.pad(0.45), {
      padding: [28, 28],
    });
  }, [center, map, points]);

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

export function VillageMapBlock({
  villageSlug,
  villageName,
}: {
  villageSlug: string;
  villageName: string;
}) {
  const { data, error } = useVillageMapData();
  const { lang } = useI18n();
  const [zoom, setZoom] = useState(12);
  const buildings = useLazyCollection(DATA_URLS.buildings, zoom >= BUILDING_MIN_ZOOM);

  const villagePoints = useMemo(() => {
    if (!data) return [];

    return data.places.features
      .map((feature) => {
        if (feature.geometry.type !== "Point") return null;
        const [lng, lat] = feature.geometry.coordinates;
        const officialSlug = property(feature, "officialSlug");
        if (!officialSlug) return null;

        const officialVillage = OFFICIAL_VILLAGES.find((village) => village.slug === officialSlug);
        if (!officialVillage) return null;

        return {
          id: property(feature, "@id") || `${lng}-${lat}`,
          name: displayVillageName(officialVillage, lang),
          position: [lat, lng] as [number, number],
          slug: officialSlug,
        };
      })
      .filter((point): point is VillagePoint => Boolean(point));
  }, [data, lang]);

  const currentPoint = villagePoints.find((point) => point.slug === villageSlug);

  const neighborPoints = useMemo(() => {
    if (!currentPoint) return [];

    return villagePoints
      .filter((point) => point.slug !== villageSlug)
      .map((point) => ({
        ...point,
        distance: distanceKm(currentPoint.position, point.position),
      }))
      .filter((point) => point.distance <= 16)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);
  }, [currentPoint, villagePoints, villageSlug]);

  const nearbyRoads = useNearbyLayer(data?.roads, currentPoint?.position, 18);
  const nearbyRivers = useNearbyLayer(data?.rivers, currentPoint?.position, 18);
  const nearbyLakes = useNearbyLayer(data?.lakes, currentPoint?.position, 18);
  const nearbyContextRoads = useNearbyLayer(data?.contextRoads, currentPoint?.position, 24);
  const nearbyContextRivers = useNearbyLayer(data?.contextRivers, currentPoint?.position, 24);
  const nearbyBuildings = useNearbyLayer(buildings, currentPoint?.position, 8);

  if (error) {
    return (
      <VillageMapShell villageName={villageName}>
        <MapPending message="Map data could not be loaded." />
      </VillageMapShell>
    );
  }

  if (!data) {
    return (
      <VillageMapShell villageName={villageName}>
        <MapPending message="Loading map..." />
      </VillageMapShell>
    );
  }

  if (!currentPoint || !nearbyRoads || !nearbyRivers || !nearbyLakes) {
    return (
      <VillageMapShell villageName={villageName}>
        <MapPending message="Village coordinates are pending verification." />
      </VillageMapShell>
    );
  }

  return (
    <VillageMapShell villageName={villageName}>
      <div className="village-mini-map h-[360px] overflow-hidden bg-[#efe5cf] md:h-[430px]">
        <MapContainer
          center={currentPoint.position}
          zoom={12}
          minZoom={9}
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
          dragging
          preferCanvas
          className="h-full w-full"
        >
          <FitVillageMap center={currentPoint.position} points={neighborPoints} />
          <ZoomWatcher onZoomChange={setZoom} />

          {nearbyContextRoads ? (
            <GeoJSON
              data={nearbyContextRoads}
              style={(feature) => contextRoadStyle(feature as GeoJsonFeature)}
              interactive={false}
            />
          ) : null}
          {nearbyContextRivers ? (
            <GeoJSON data={nearbyContextRivers} style={contextRiverStyle} interactive={false} />
          ) : null}

          <GeoJSON
            data={nearbyRoads}
            style={(feature) => roadStyle(feature as GeoJsonFeature)}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "road")
            }
          />
          <GeoJSON
            data={nearbyRivers}
            style={(feature) => riverStyle(feature as GeoJsonFeature)}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "river")
            }
          />
          <GeoJSON
            data={nearbyLakes}
            style={lakeStyle}
            onEachFeature={(feature, layer) =>
              bindFeatureTooltip(layer, feature as GeoJsonFeature, "lake")
            }
          />

          {zoom >= BUILDING_MIN_ZOOM && nearbyBuildings ? (
            <GeoJSON data={nearbyBuildings} style={buildingStyle} interactive={false} />
          ) : null}

          {neighborPoints.map((point) => (
            <CircleMarker
              key={point.id}
              center={point.position}
              radius={3.2}
              pathOptions={{
                color: "#496252",
                fillColor: "#496252",
                fillOpacity: 0.74,
                opacity: 0.78,
                weight: 1,
              }}
            >
              <Tooltip
                permanent
                direction="right"
                offset={[7, 0]}
                className="village-mini-map-label neighbor"
              >
                {point.name}
              </Tooltip>
            </CircleMarker>
          ))}

          <CircleMarker
            center={currentPoint.position}
            radius={7}
            pathOptions={{
              color: "#123f2a",
              fillColor: "#d7a548",
              fillOpacity: 0.95,
              opacity: 1,
              weight: 2.2,
            }}
          >
            <Tooltip
              permanent
              direction="right"
              offset={[10, 0]}
              className="village-mini-map-label current"
            >
              {currentPoint.name}
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>
    </VillageMapShell>
  );
}

function useNearbyLayer(
  collection: GeoJsonCollection | null | undefined,
  center: [number, number] | undefined,
  radiusKm: number,
) {
  return useMemo(() => {
    if (!collection || !center) return null;
    return nearbyCollection(collection, center, radiusKm);
  }, [center, collection, radiusKm]);
}

function VillageMapShell({
  children,
  villageName,
}: {
  children: ReactNode;
  villageName: string;
}) {
  return (
    <div className="mt-12 overflow-hidden border hairline bg-[#efe5cf]">
      {children}
      <div className="border-t hairline bg-background/95 px-4 py-4">
        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[#123f2a] bg-[#d7a548]" />
            <span>{villageName}</span>
          </div>
          <Link
            to="/map"
            className="inline-flex items-center gap-2 text-foreground transition-colors hover:text-[var(--beige)]"
          >
            Open full district map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/55">
          Map data © OpenStreetMap contributors.
        </p>
      </div>
    </div>
  );
}

function MapPending({ message }: { message: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[#26352d]">
      <MapPin className="h-5 w-5" strokeWidth={1.5} />
      <p>{message}</p>
    </div>
  );
}
