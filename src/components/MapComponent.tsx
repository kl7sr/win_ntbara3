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

  // Update Points Markers with support for Active (Red) vs Extinguished/Inactive (Grey) Fires
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    points.forEach((point) => {
      const isBurntZone = point.pointType === 'burnt_zone';
      const isFireActive = isBurntZone && (point.status === 'urgent' || point.status === 'active');
      const isFireExtinguished = isBurntZone && (point.status === 'extinguished' || point.status === 'full');
      const isVerified = point.verified;

      // Color coding
      let bgColor = '#047857'; // Green (default verified charity)
      let borderColor = '#ffffff';

      if (isBurntZone) {
        if (isFireActive) {
          bgColor = '#dc2626'; // Red for active fire
          borderColor = '#fecaca';
        } else {
          bgColor = '#64748b'; // Grey for non-active / extinguished fire
          borderColor = '#e2e8f0';
        }
      } else if (!isVerified) {
        bgColor = '#d97706'; // Amber for unconfirmed
        borderColor = '#fef3c7';
      }

      const markerHtml = `
        <div class="custom-pin-container">
          <div class="custom-pin-body" style="background-color: ${bgColor}; border-color: ${borderColor};">
            <span class="custom-pin-icon">
              ${isBurntZone ? `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              ` : isVerified ? `
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

      const googleMapsUrl = point.googleMapsUrl || `https://maps.google.com/?q=${point.lat},${point.lng}`;

      const accentColor = isBurntZone
        ? (isFireActive ? '#ef4444' : '#94a3b8')
        : (isVerified ? '#059669' : '#f59e0b');

      const statusDotColor = isBurntZone
        ? (isFireActive ? '#ef4444' : '#94a3b8')
        : (isVerified ? '#059669' : '#f59e0b');

      const statusText = isBurntZone
        ? (isFireExtinguished ? 'تم الإخماد' : 'بؤرة حريق نشطة')
        : (isVerified ? 'موقع مؤكد' : 'غير مؤكد');

      const statusTextColor = isBurntZone
        ? (isFireActive ? '#b91c1c' : '#475569')
        : (isVerified ? '#065f46' : '#92400e');

      const popupHtml = `
        <div style="padding: 14px; font-family: 'Cairo', system-ui, sans-serif; direction: rtl; text-align: right; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: ${statusDotColor}; flex-shrink: 0;"></span>
            <span style="font-size: 11px; font-weight: 700; color: ${statusTextColor};">
              ${statusText}
            </span>
          </div>

          <div style="font-weight: 800; font-size: 13.5px; color: #0f172a; line-height: 1.35; margin-bottom: 4px;">
            ${point.title}
          </div>

          <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 12px;">
            ${point.wilayaNameAr} - ${point.commune}
          </div>

          <div style="display: grid; grid-template-columns: ${isBurntZone ? '1fr 1fr' : '1fr 1fr 1fr'}; gap: 6px;">
            ${!isBurntZone && point.phone ? `
              <a href="tel:${point.phone}" style="display: flex; align-items: center; justify-content: center; background: #047857; color: #ffffff; padding: 7.5px 4px; border-radius: 12px; font-size: 11px; font-weight: 800; text-decoration: none; box-shadow: 0 1px 2px rgba(4,120,87,0.15);">
                اتصال
              </a>
            ` : ''}
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #334155; padding: 7.5px 4px; border-radius: 12px; font-size: 11px; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0;">
              الاتجاهات
            </a>
            <button onclick="window.__openPointDetails('${point.id}')" style="display: flex; align-items: center; justify-content: center; background: #0f172a; color: #ffffff; padding: 7.5px 4px; border-radius: 12px; font-size: 11px; font-weight: 700; border: none; cursor: pointer;">
              التفاصيل
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-map-pin-popup',
        offset: [0, -28],
        closeButton: true,
        autoPan: true,
      });

      marker.on('click', () => {
        mapInstanceRef.current?.flyTo([point.lat, point.lng], 16.5, {
          duration: 1.0,
        });
      });

      markersLayerRef.current?.addLayer(marker);
    });

    (window as any).__openPointDetails = (pointId: string) => {
      const p = points.find((item) => item.id === pointId);
      if (p) {
        mapInstanceRef.current?.flyTo([p.lat, p.lng], 16.5, {
          duration: 1.0,
        });
        onSelectPoint(p);
      }
    };
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

      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1.2,
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

  // Focus and Zoom in Closely on Selected Point
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPoint) return;
    mapInstanceRef.current.flyTo([selectedPoint.lat, selectedPoint.lng], 16.5, {
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
