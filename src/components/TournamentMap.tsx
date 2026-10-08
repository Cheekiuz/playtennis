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
    let group: { remove: () => void } | null = null;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default ?? leaflet;
      if (cancelled || !nodeRef.current) return;

      mapRef.current?.remove();
      const map = L.map(nodeRef.current, { scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const redraw = () => {
        group?.remove();
        group = drawMarkers(L, map, points, openLabel);
      };
      map.on("moveend", redraw);

      if (points.length === 0) {
        map.setView([20, 0], 2);
      } else if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 8);
      } else {
        map.fitBounds(
          points.map((point) => [point.lat, point.lng] as [number, number]),
          { padding: [40, 40], maxZoom: 10 },
        );
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

function drawMarkers(
  L: typeof import("leaflet"),
  map: LeafletMap,
  points: MapPoint[],
  openLabel: string,
) {
  const group = L.layerGroup().addTo(map);
  const buckets = new Map<string, MapPoint[]>();
  for (const point of points) {
    const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
    const key = `${Math.round(pixel.x / 56)}:${Math.round(pixel.y / 56)}`;
    const list = buckets.get(key) ?? [];
    list.push(point);
    buckets.set(key, list);
  }

  for (const groupPoints of buckets.values()) {
    if (groupPoints.length === 1) {
      const point = groupPoints[0];
      L.marker([point.lat, point.lng], { icon: pointIcon(L) })
        .bindPopup(popupHtml(point, openLabel))
        .addTo(group);
      continue;
    }

    const lat = groupPoints.reduce((sum, point) => sum + point.lat, 0) / groupPoints.length;
    const lng = groupPoints.reduce((sum, point) => sum + point.lng, 0) / groupPoints.length;
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "",
        html: `<span style="display:flex;width:32px;height:32px;border-radius:99px;background:#c8ff00;border:2px solid #111;align-items:center;justify-content:center;font:700 12px sans-serif;color:#111">${groupPoints.length}</span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    });
    marker.on("click", () => {
      if (map.getZoom() >= 14) {
        marker.bindPopup(groupPoints.map((point) => popupHtml(point, openLabel)).join("<hr/>")).openPopup();
        return;
      }
      map.fitBounds(
        groupPoints.map((point) => [point.lat, point.lng] as [number, number]),
        { padding: [40, 40], maxZoom: map.getZoom() + 2 },
      );
    });
    marker.addTo(group);
  }

  return group;
}

function pointIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: '<span style="display:block;width:14px;height:14px;border-radius:99px;background:#c8ff00;border:2px solid #111"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function popupHtml(point: MapPoint, openLabel: string): string {
  return `<strong>${escapeHtml(point.name)}</strong><br/>${escapeHtml(point.city)}<br/><a href="${escapeHtml(point.href)}">${escapeHtml(openLabel)}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
