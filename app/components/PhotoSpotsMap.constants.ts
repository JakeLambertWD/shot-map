// Free vector tiles from OpenFreeMap (no API key). Keep the attribution control visible.
// OpenFreeMap's Liberty style, recoloured like Google Maps' dark mode in mapStyle.ts.
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Centred on London Bridge.
export const INITIAL_VIEW_STATE = {
  longitude: -0.0877,
  latitude: 51.5076,
  zoom: 12,
} as const;

export const MAP_MAX_ZOOM = 19;

// Zoom used when centring on the user's location.
export const USER_LOCATION_ZOOM = 14;

// Pins are grouped once their centres are closer than one pin width, i.e. when they start to overlap.
export const CLUSTER_RADIUS = 46;
// Above this zoom level pins are never grouped.
export const CLUSTER_MAX_ZOOM = 17;

// Keeps the search bar clear of the top edge of the screen.
export const MAP_OVERLAY_TOP_OFFSET = "1rem";
// Distance from the bottom edge; the map attribution is centred on the same row.
export const MAP_OVERLAY_BOTTOM_OFFSET = "1.5rem";

// Remembers the last opened spot so the map can centre on it when the user comes back.
export const LAST_SPOT_STORAGE_KEY = "photo-spots:last-opened";
