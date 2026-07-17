"use client";

import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DaySlot } from "@tripmind/shared";
import {
  buildTripRoutes,
  emptyRouteGeoJson,
  itineraryToRoutePoints,
  ROUTE_DAY_COLORS,
  type RouteGeoJson,
} from "../lib/build-route-geojson";
import type { Place } from "../types";

/** OpenFreeMap — free tiles, không cần API key (docs architecture). */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const ROUTE_SOURCE_ID = "trip-day-routes";
const ROUTE_LAYER_ID = "trip-day-routes-line";

type RouteItem = {
  dayNumber: number;
  slot: DaySlot;
  visitOrder: number;
  placeId: string;
  place?: { id: string; lat: string; lng: string; name: string } | null;
};

type Props = {
  places: Place[];
  /** Marker tạm khi đang chọn điểm trên bản đồ (form). */
  draft?: { lat: number; lng: number } | null;
  /** Click list → map bay tới place này. */
  focusPlaceId?: string | null;
  /** Itinerary để vẽ polyline + số. */
  routeItems?: RouteItem[];
  /**
   * Ngày đang xem trên tab. `null` = tab “Tất cả địa điểm” (mọi pin, không đường).
   * Khi pick tọa độ, parent thường truyền null + showRoutes=false.
   */
  filterDay?: number | null;
  /** false khi create/relocate hoặc tab all-places. */
  showRoutes?: boolean;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
};

function parseCoord(value: string): number {
  return Number.parseFloat(value);
}

function ensureRouteLayer(map: MapLibreMap): void {
  if (map.getSource(ROUTE_SOURCE_ID)) return;

  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data: emptyRouteGeoJson(),
  });

  const colorExpr = [
    "match",
    ["get", "colorIndex"],
    ...ROUTE_DAY_COLORS.flatMap((color, index) => [index, color]),
    ROUTE_DAY_COLORS[0],
  ] as unknown as maplibregl.ExpressionSpecification;

  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": colorExpr,
      "line-width": 3.5,
      "line-opacity": 0.85,
    },
  });
}

function setRouteData(map: MapLibreMap, data: RouteGeoJson) {
  ensureRouteLayer(map);
  const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(data as Parameters<GeoJSONSource["setData"]>[0]);
}

export function TripMap({
  places,
  draft,
  focusPlaceId,
  routeItems = [],
  filterDay = null,
  showRoutes = true,
  onMapClick,
  className,
}: Props) {
  const t = useTranslations("Places");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const draftMarkerRef = useRef<Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const lastFitKeyRef = useRef<string>("");

  const routes = useMemo(() => {
    if (!showRoutes || filterDay == null) {
      return buildTripRoutes([]);
    }
    const points = itineraryToRoutePoints(routeItems, places);
    return buildTripRoutes(points, { filterDay });
  }, [routeItems, places, filterDay, showRoutes]);

  /** Tab ngày: chỉ place có trong lộ trình ngày đó. Tab all / pick: mọi place. */
  const visiblePlaces = useMemo(() => {
    if (!showRoutes || filterDay == null) return places;
    return places.filter((place) => routes.placeLabels.has(place.id));
  }, [places, showRoutes, filterDay, routes.placeLabels]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const container = containerRef.current;
    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: [108.45, 11.94],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("click", (event) => {
      onMapClickRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    const resize = () => {
      map.resize();
    };
    map.on("load", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      draftMarkerRef.current?.remove();
      draftMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      lastFitKeyRef.current = "";
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const data = showRoutes ? routes.geojson : emptyRouteGeoJson();
      setRouteData(map, data);
    };

    if (map.isStyleLoaded()) {
      apply();
      return;
    }

    map.once("load", apply);
    return () => {
      map.off("load", apply);
    };
  }, [routes.geojson, showRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const routeMode = showRoutes && filterDay != null;

    visiblePlaces.forEach((place) => {
      const lat = parseCoord(place.lat);
      const lng = parseCoord(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const focused = place.id === focusPlaceId;
      const label = routeMode ? routes.placeLabels.get(place.id) : undefined;
      const dayColor =
        label != null
          ? ROUTE_DAY_COLORS[(label.dayNumber - 1) % ROUTE_DAY_COLORS.length]
          : undefined;

      const el = document.createElement("div");
      const size = focused ? "h-8 w-8" : "h-7 w-7";
      const ring = focused ? "ring-2 ring-offset-2 shadow-lg" : "shadow";
      el.className = `flex ${size} items-center justify-center rounded-full border-2 border-white text-xs font-semibold ${ring}`;
      el.style.color = "#fff";

      if (label && dayColor) {
        el.style.backgroundColor = dayColor;
        if (focused) el.style.boxShadow = `0 0 0 2px ${dayColor}`;
        el.textContent = String(label.number);
        el.title = t("routeMarkerTitle", {
          name: place.name,
          day: label.dayNumber,
          number: label.number,
        });
      } else {
        el.style.backgroundColor = "#0d9488";
        el.textContent = "·";
        el.title = place.name;
      }

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [visiblePlaces, focusPlaceId, routes.placeLabels, showRoutes, filterDay, t]);

  // Fit bounds khi đổi tab / places (không đụng khi đang focus 1 place)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focusPlaceId) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasPoint = false;

    visiblePlaces.forEach((place) => {
      const lat = parseCoord(place.lat);
      const lng = parseCoord(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      bounds.extend([lng, lat]);
      hasPoint = true;
    });

    if (draft && Number.isFinite(draft.lat) && Number.isFinite(draft.lng)) {
      bounds.extend([draft.lng, draft.lat]);
      hasPoint = true;
    }

    if (!hasPoint) return;

    const fitKey = `${filterDay ?? "all"}:${visiblePlaces.map((p) => p.id).join(",")}:${draft ? "d" : ""}`;
    if (fitKey === lastFitKeyRef.current && !draft) return;
    lastFitKeyRef.current = fitKey;

    map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
  }, [visiblePlaces, draft, focusPlaceId, filterDay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusPlaceId) return;

    const place = places.find((p) => p.id === focusPlaceId);
    if (!place) return;

    const lat = parseCoord(place.lat);
    const lng = parseCoord(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 14),
      duration: 900,
      essential: true,
    });
  }, [focusPlaceId, places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    draftMarkerRef.current?.remove();
    draftMarkerRef.current = null;

    if (!draft) return;

    const el = document.createElement("div");
    el.className =
      "h-4 w-4 rounded-full border-2 border-white bg-amber-500 shadow ring-2 ring-amber-600";
    el.title = "Draft";

    draftMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([draft.lng, draft.lat])
      .addTo(map);
  }, [draft]);

  return (
    <div
      className={`relative ${className ?? "h-72 w-full overflow-hidden rounded-lg border border-zinc-200"}`}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
