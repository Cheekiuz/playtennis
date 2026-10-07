"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  href: string;
};

export default function TournamentMap({
  points,
  emptyLabel,
  note,
  openLabel,
}: {
  points: MapPoint[];
  emptyLabel: string;
  note: string;
  openLabel: string;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default ?? leaflet;
      if (cancelled || !nodeRef.current) return;

      mapRef.current?.remove();
      const map = L.map(nodeRef.current, { scrollWheelZoom: false }).setView([50.5, 14], 4);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const point of points) {
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: "",
            html: '<span style="display:block;width:14px;height:14px;border-radius:99px;background:#c8ff00;border:2px solid #111"></span>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        });
        marker.bindPopup(
          `<strong>${escapeHtml(point.name)}</strong><br/>${escapeHtml(point.city)}<br/><a href="${escapeHtml(point.href)}">${escapeHtml(openLabel)}</a>`,
        );
        marker.addTo(map);
        bounds.push([point.lat, point.lng]);
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 8);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7 });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points, openLabel]);

  return (
    <div className="grid gap-3">
      <p className="text-sm text-foreground/70">{points.length === 0 ? emptyLabel : note}</p>
      <div ref={nodeRef} className="h-[70vh] min-h-80 w-full border border-border bg-surface" />
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
