"use client";

import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Place } from "../types";

/** OpenFreeMap — free tiles, không cần API key (docs architecture). */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  places: Place[];
  /** Marker tạm khi đang chọn điểm trên bản đồ (form). */
  draft?: { lat: number; lng: number } | null;
  /** Click list → map bay tới place này. */
  focusPlaceId?: string | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
};

function parseCoord(value: string): number {
  return Number.parseFloat(value);
}

export function TripMap({ places, draft, focusPlaceId, onMapClick, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const draftMarkerRef = useRef<Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const didInitialFitRef = useRef(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Init map 1 lần
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [108.45, 11.94],
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("click", (event) => {
      onMapClickRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      draftMarkerRef.current?.remove();
      draftMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      didInitialFitRef.current = false;
    };
  }, []);

  // Markers places (không đụng camera — camera xử lý riêng)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    places.forEach((place, index) => {
      const lat = parseCoord(place.lat);
      const lng = parseCoord(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const focused = place.id === focusPlaceId;
      const el = document.createElement("div");
      el.className = focused
        ? "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent text-xs font-semibold text-accent-foreground shadow-lg ring-2 ring-accent ring-offset-2"
        : "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-accent text-xs font-semibold text-accent-foreground shadow";
      el.textContent = String(index + 1);
      el.title = place.name;

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [places, focusPlaceId]);

  // Lần đầu có places → fit tất cả; draft khi create/relocate cũng fit nhẹ
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focusPlaceId) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasPoint = false;

    places.forEach((place) => {
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

    if (!didInitialFitRef.current || draft) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
      didInitialFitRef.current = true;
    }
  }, [places, draft, focusPlaceId]);

  // Click list → bay tới place
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

  // Draft marker riêng
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
      ref={containerRef}
      className={className ?? "h-72 w-full overflow-hidden rounded-lg border border-zinc-200"}
    />
  );
}
