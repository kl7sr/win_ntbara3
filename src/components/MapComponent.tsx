import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CharityPoint, UserLocation } from '../types';
import { Locate, Layers, ZoomIn, ZoomOut, Maximize2, HeartHandshake } from 'lucide-react';
import { WILAYAS } from '../data/wilayas';

interface MapComponentProps {
  points: CharityPoint[];
  selectedPoint: CharityPoint | null;
  onSelectPoint: (point: CharityPoint) => void;
  userLocation: UserLocation | null;
  onRequestUserLocation: () => void;
  selectedWilaya: number | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  userLocation,
  onRequestUserLocation,
  selectedWilaya,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Algeria central view
    const map = L.map(mapContainerRef.current, {
      center: [35.5, 3.5],
      zoom: 6.5,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
    });

    const southWest = L.latLng(18.0, -9.0);
    const northEast = L.latLng(38.0, 12.5);
    const bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);

    // Clean OpenStreetMap standard tiles (Zero API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Points Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    points.forEach((point) => {
      const isUrgent = point.status === 'urgent';
      const bgColor = isUrgent ? '#dc2626' : '#047857';

      // Clean SVG pin icon without neon
      const markerHtml = `
        <div class="custom-pin-container">
          <div class="custom-pin-body" style="background-color: ${bgColor};">
            <span class="custom-pin-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([point.lat, point.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectPoint(point);
      });

      marker.bindTooltip(
        `<div style="font-weight:700; color:#0f172a;">${point.title}</div><div style="font-size:11px; color:#047857;">${point.organizer} (${point.wilayaNameAr})</div>`,
        { direction: 'top', offset: [0, -28], opacity: 1 }
      );

      markersLayerRef.current?.addLayer(marker);
    });
  }, [points, onSelectPoint]);

  // Update User GPS Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userLocation) {
      const userHtml = `
        <div class="user-gps-marker"></div>
      `;

      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: userHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (!userMarkerRef.current) {
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(mapInstanceRef.current)
          .bindTooltip('موقعك الحالي', { permanent: false, direction: 'top' });
        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    }
  }, [userLocation]);

  // Handle selected Wilaya change
  useEffect(() => {
    if (!mapInstanceRef.current || selectedWilaya === null) return;
    const wilaya = WILAYAS.find((w) => w.code === selectedWilaya);
    if (wilaya) {
      mapInstanceRef.current.flyTo([wilaya.lat, wilaya.lng], wilaya.zoom || 11, {
        duration: 1.2,
      });
    }
  }, [selectedWilaya]);

  // Focus on Selected Point
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPoint) return;
    mapInstanceRef.current.flyTo([selectedPoint.lat, selectedPoint.lng], 14, {
      duration: 1.0,
    });
  }, [selectedPoint]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    if (points.length > 0) {
      const group = L.featureGroup(
        points.map((p) => L.marker([p.lat, p.lng]))
      );
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
    } else {
      mapInstanceRef.current.setView([35.5, 3.5], 6.5);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-100px)] bg-slate-100 overflow-hidden">
      {/* Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* GPS Locate Button */}
        <button
          onClick={onRequestUserLocation}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-300 shadow-md transition"
          title="تحديد موقعي الحالي"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Fit All Points */}
        <button
          onClick={handleFitAll}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-md transition"
          title="عرض كامل الخريطة"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-4 z-20 hidden sm:flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-md transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 shadow-md transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Clean Legend (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 hidden md:flex items-center gap-3 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
          <span>نقطة تبرع</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          <span>حاجة عاجلة</span>
        </div>
      </div>
    </div>
  );
};
