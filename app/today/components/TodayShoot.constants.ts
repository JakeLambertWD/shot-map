import type { ShootSpot } from "@/server/routers/shoot";

// Straight-line distance between two spots, in kilometres.
export function getDistanceKm(from: ShootSpot, to: ShootSpot) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// Walking directions through every spot not yet shot, starting from wherever the viewer is.
export function getRouteUrl(spots: ShootSpot[]) {
  const stops = spots.map((spot) => `${spot.latitude},${spot.longitude}`);
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("travelmode", "walking");
  url.searchParams.set("destination", stops[stops.length - 1]);
  if (stops.length > 1) url.searchParams.set("waypoints", stops.slice(0, -1).join("|"));
  return url.toString();
}

export function formatShootDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatShotTime(shotAt: string) {
  return new Date(shotAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
