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
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
};

function parseCoord(value: string): number {
  return Number.parseFloat(value);
}

export function TripMap({ places, draft, onMapClick, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const draftMarkerRef = useRef<Marker | null>(null);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Init map 1 lần
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [108.45, 11.94], // Đà Lạt mặc định
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
    };
  }, []);

  // Markers places + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    let hasPoint = false;

    places.forEach((place, index) => {
      const lat = parseCoord(place.lat);
      const lng = parseCoord(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const el = document.createElement("div");
      el.className =
        "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-teal-800 text-xs font-semibold text-white shadow";
      el.textContent = String(index + 1);
      el.title = place.name;

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
      hasPoint = true;
    });

    if (draft && Number.isFinite(draft.lat) && Number.isFinite(draft.lng)) {
      bounds.extend([draft.lng, draft.lat]);
      hasPoint = true;
    }

    if (hasPoint) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 500 });
    }
  }, [places, draft]);

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
