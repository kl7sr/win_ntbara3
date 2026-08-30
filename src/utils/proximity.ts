import { CharityPoint, Wilaya } from '../types';
import { WILAYAS } from '../data/wilayas';

/**
 * Calculates distance between two coordinates in Kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface WilayaPartitionedPoints {
  selectedWilaya: Wilaya;
  inWilayaPoints: CharityPoint[];
  borderNeighborPoints: { point: CharityPoint; distanceToWilayaCenterKm: number }[];
}

/**
 * Partitions points into:
 * 1. Inside the selected wilaya
 * 2. Closest donation centers in neighboring/nearby wilayas sorted by distance
 */
export function getPointsForWilayaWithNeighbors(
  wilayaCode: number,
  allPoints: CharityPoint[]
): WilayaPartitionedPoints | null {
  const wilaya = WILAYAS.find((w) => w.code === wilayaCode);
  if (!wilaya) return null;

  const inWilayaPoints: CharityPoint[] = [];
  const otherWilayaPoints: { point: CharityPoint; distanceToWilayaCenterKm: number }[] = [];

  for (const point of allPoints) {
    if (point.wilayaCode === wilayaCode) {
      inWilayaPoints.push(point);
    } else {
      const dist = calculateDistanceKm(wilaya.lat, wilaya.lng, point.lat, point.lng);
      otherWilayaPoints.push({ point, distanceToWilayaCenterKm: dist });
    }
  }

  // Sort other wilaya points from closest to farthest
  otherWilayaPoints.sort((a, b) => a.distanceToWilayaCenterKm - b.distanceToWilayaCenterKm);

  // Return the closest neighboring points (top 8 closest)
  const borderNeighborPoints = otherWilayaPoints.slice(0, 8);

  return {
    selectedWilaya: wilaya,
    inWilayaPoints,
    borderNeighborPoints,
  };
}
