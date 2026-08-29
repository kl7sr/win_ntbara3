import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CharityPoint, UserLocation } from '../types';
import { Locate, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { ALGERIA_BOUNDS } from '../utils/geoParser';

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

  // Initialize Map strictly constrained to Algeria
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const algeriaBounds = L.latLngBounds(
      L.latLng(ALGERIA_BOUNDS.minLat, ALGERIA_BOUNDS.minLng),
      L.latLng(ALGERIA_BOUNDS.maxLat, ALGERIA_BOUNDS.maxLng)
    );

    const map = L.map(mapContainerRef.current, {
      center: [35.0, 3.0],
      zoom: 6.5,
      minZoom: 5.5,
      maxZoom: 18,
      maxBounds: algeriaBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      bounds: algeriaBounds,
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
      const isVerified = point.verified;
      const bgColor = isVerified ? '#047857' : '#d97706';

      const markerHtml = `
        <div class="custom-pin-container">
          <div class="custom-pin-body" style="background-color: ${bgColor}; border-color: ${isVerified ? '#ffffff' : '#fef3c7'};">
            <span class="custom-pin-icon">
              ${isVerified ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              ` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              `}
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

      const statusBadge = isVerified 
        ? `<span style="color:#047857; font-weight:600;">✓ مؤكد</span>`
        : `<span style="color:#d97706; font-weight:600;">⚠️ غير مؤكد (اتصل قبل التنقل)</span>`;

      marker.bindTooltip(
        `<div style="font-weight:700; color:#0f172a;">${point.title}</div>
         <div style="font-size:11px; color:#64748b;">${point.organizer} (${point.wilayaNameAr})</div>
         <div style="font-size:10px; margin-top:2px;">${statusBadge}</div>`,
        { direction: 'top', offset: [0, -28], opacity: 1 }
      );

      markersLayerRef.current?.addLayer(marker);
    });
  }, [points, onSelectPoint]);

  // Update User GPS Marker & Zoom to User Location
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

      // Smoothly zoom in on where user is
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14, {
        duration: 1.5,
      });
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
    mapInstanceRef.current.setView([35.0, 3.0], 6.5);
  };

  const handleLocateClick = () => {
    onRequestUserLocation();
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      {/* Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {/* GPS Locate & Zoom Button */}
        <button
          onClick={handleLocateClick}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 rounded-xl border border-slate-300 shadow-md transition active:scale-95"
          title="تحديد موقعي والتكبير عليه"
        >
          <Locate className="w-5 h-5 text-emerald-700" />
        </button>

        {/* Fit Algeria */}
        <button
          onClick={handleFitAll}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-300 shadow-md transition active:scale-95"
          title="عرض خريطة الجزائر"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-16 sm:bottom-4 right-3 z-20 flex items-center gap-3 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
          <span>موقع مؤكد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-600"></span>
          <span>غير مؤكد (اتصل قبل الذهاب)</span>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-3 z-20 hidden sm:flex flex-col gap-1.5">
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
    </div>
  );
};
