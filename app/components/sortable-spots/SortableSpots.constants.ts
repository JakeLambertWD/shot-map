export const SPOT_ROW_DIVIDER = "1px solid var(--mantine-color-teal-4)";

export const SPOT_THUMBNAIL_SIZE = 56;

// A spot's postcode, or its coordinates when it has none.
export function formatSpotLocation(spot: {
  postcode: string | null;
  latitude: number;
  longitude: number;
}) {
  return spot.postcode ?? `${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`;
}

export function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
