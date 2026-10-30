import { useQuery } from "@tanstack/react-query";
import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { MAP_STYLE_URL } from "./PhotoSpotsMap.constants";

// Google Maps' dark mode palette, applied over OpenFreeMap's Liberty style. Most things are
// quiet greys so the parks, water and main roads stand out.
const PARK_GREEN = "#1e3a2b";

export const MAP_COLOURS = {
  land: "#242424",
  residential: "rgba(255, 255, 255, 0.015)",
  park: PARK_GREEN,
  wood: PARK_GREEN,
  grass: PARK_GREEN,
  sportsPitch: PARK_GREEN,
  cemetery: PARK_GREEN,
  hospital: "#352a2a",
  school: "#2d2b26",
  sand: "#33302a",
  ice: "#2a2d30",
  water: "#17344f",
  waterLabel: "#6f9cc4",
  waterLabelHalo: "#17344f",
  airport: "#2b2b2b",
  runway: "#3a3a3a",
  motorway: "#7a7262",
  motorwayCasing: "#4a463d",
  mainRoad: "#5f6368",
  mainRoadCasing: "#3c3f42",
  road: "#363636",
  roadCasing: "#242424",
  path: "#3a3a3a",
  rail: "#4a4a4a",
  building: "#2c2c2c",
  buildingOutline: "#323232",
  boundary: "#5f6368",
  placeLabel: "#c4c7c5",
  label: "#9aa0a6",
  transitLabel: "#8ab4f8",
  labelHalo: "#242424",
} as const;

// Liberty layers left out: the light satellite-style backdrop shown when zoomed right out,
// the 3D building extrusions, and the light striped pattern on pedestrian areas and the
// one-way arrows, which show up as bright white marks on a dark map, and the road number
// boxes (A1, A5200…).
const HIDDEN_LAYERS = new Set([
  "natural_earth",
  "building-3d",
  "road_area_pattern",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
]);

type Paint = Record<string, string | number>;

// Liberty fades its green areas, which turns them grey on a dark map, so they're drawn solid.
const GREEN_OPACITY = 1;

const TRANSIT_LABEL_MIN_ZOOM = 15;

// Picks our colours for a Liberty layer by its id. Unmatched layers keep Liberty's colours.
function getPaint(layer: LayerSpecification): Paint | null {
  const c = MAP_COLOURS;
  const { id } = layer;

  if (id === "background") return { "background-color": c.land };
  if (id === "park") {
    return { "fill-color": c.park, "fill-outline-color": c.park, "fill-opacity": GREEN_OPACITY };
  }
  if (id === "park_outline") return { "line-color": c.park };
  if (id === "landuse_residential") return { "fill-color": c.residential };
  if (id === "landcover_wood") return { "fill-color": c.wood, "fill-opacity": GREEN_OPACITY };
  if (id === "landcover_grass") return { "fill-color": c.grass, "fill-opacity": GREEN_OPACITY };
  if (id === "landcover_ice") return { "fill-color": c.ice };
  if (id === "landcover_sand") return { "fill-color": c.sand };
  if (id === "landuse_pitch" || id === "landuse_track") {
    return { "fill-color": c.sportsPitch, "fill-opacity": GREEN_OPACITY };
  }
  if (id === "landuse_cemetery") return { "fill-color": c.cemetery, "fill-opacity": GREEN_OPACITY };
  if (id === "landuse_hospital") return { "fill-color": c.hospital };
  if (id === "landuse_school") return { "fill-color": c.school };
  if (id === "water") return { "fill-color": c.water };
  if (id.startsWith("waterway_") && layer.type === "line") return { "line-color": c.water };
  if (id === "aeroway_fill") return { "fill-color": c.airport };
  if (id === "aeroway_runway" || id === "aeroway_taxiway") return { "line-color": c.runway };

  if (layer.type === "line" && /^(road|tunnel|bridge)_/.test(id)) {
    if (/rail/.test(id)) return { "line-color": c.rail };
    if (/path_pedestrian$/.test(id)) return { "line-color": c.path };
    const isCasing = id.endsWith("_casing");
    if (/motorway/.test(id)) return { "line-color": isCasing ? c.motorwayCasing : c.motorway };
    if (/trunk_primary/.test(id)) {
      return { "line-color": isCasing ? c.mainRoadCasing : c.mainRoad };
    }
    return { "line-color": isCasing ? c.roadCasing : c.road };
  }

  if (id === "building") {
    return { "fill-color": c.building, "fill-outline-color": c.buildingOutline };
  }
  if (id.startsWith("boundary_")) return { "line-color": c.boundary };

  if (layer.type === "symbol") {
    const halo = { "text-halo-color": c.labelHalo };
    if (id.startsWith("water")) {
      return { "text-color": c.waterLabel, "text-halo-color": c.waterLabelHalo };
    }
    if (id === "poi_transit") return { "text-color": c.transitLabel, ...halo };
    if (id.startsWith("label_")) return { "text-color": c.placeLabel, ...halo };
    if (id.startsWith("poi_") || id.startsWith("highway-name") || id === "airport") {
      return { "text-color": c.label, ...halo };
    }
  }

  return null;
}

export function toMapStyle(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers
      .filter((layer) => !HIDDEN_LAYERS.has(layer.id))
      .map((layer) => {
        const paint = getPaint(layer);
        // Bus stop labels only show once you're zoomed in close, to keep the map tidy.
        const minzoom = layer.id === "poi_transit" ? { minzoom: TRANSIT_LABEL_MIN_ZOOM } : {};
        if (!paint) return { ...layer, ...minzoom } as LayerSpecification;
        return {
          ...layer,
          ...minzoom,
          paint: { ...("paint" in layer ? layer.paint : {}), ...paint },
        } as LayerSpecification;
      }),
  };
}

// Loads Liberty and recolours it before the map draws, so there's no flash of the original colours.
// Falls back to plain Liberty if the recolouring can't be applied.
export function useMapStyle(): StyleSpecification | string | null {
  const styleQuery = useQuery({
    queryKey: ["map-style", MAP_STYLE_URL],
    queryFn: async () => {
      const response = await fetch(MAP_STYLE_URL);
      if (!response.ok) throw new Error(`Map style failed to load (${response.status})`);
      return toMapStyle((await response.json()) as StyleSpecification);
    },
    staleTime: Infinity,
    retry: 1,
  });

  if (styleQuery.isError) return MAP_STYLE_URL;
  return styleQuery.data ?? null;
}
