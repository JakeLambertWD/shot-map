import { lookupPostcode } from "@/lib/postcodes";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// Photon is a free OpenStreetMap search API built for search-as-you-type.
// The public instance asks for "reasonable" use, which a personal map is well within.
const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_TIMEOUT_MS = 5000;
const MAX_RESULTS = 6;

// Results are ranked towards central London, but anywhere can still be found.
const SEARCH_BIAS = { latitude: 51.5074, longitude: -0.1278 } as const;

const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const photonResponseSchema = z.object({
  features: z.array(
    z.object({
      geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
      properties: z.object({
        osm_type: z.string().optional(),
        osm_id: z.number().optional(),
        name: z.string().optional(),
        housenumber: z.string().optional(),
        street: z.string().optional(),
        district: z.string().optional(),
        city: z.string().optional(),
        postcode: z.string().optional(),
        country: z.string().optional(),
        // [west, north, east, south] for areas such as parks or neighbourhoods.
        extent: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
      }),
    }),
  ),
});

export type PlaceResult = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  bounds: [west: number, south: number, east: number, north: number] | null;
};

type PhotonFeature = z.infer<typeof photonResponseSchema>["features"][number];

function toPlaceResult({ geometry, properties }: PhotonFeature, index: number): PlaceResult {
  const [longitude, latitude] = geometry.coordinates;
  const streetAddress = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  const name = properties.name ?? (streetAddress || properties.city || "Unnamed place");

  const description = [
    properties.name ? streetAddress : null,
    properties.district,
    properties.city,
    properties.postcode,
    properties.country === "United Kingdom" ? null : properties.country,
  ]
    .filter((part): part is string => Boolean(part) && part !== name)
    .join(", ");

  const extent = properties.extent;

  return {
    id: properties.osm_id ? `${properties.osm_type}-${properties.osm_id}` : `place-${index}`,
    name,
    description,
    latitude,
    longitude,
    bounds: extent ? [extent[0], extent[3], extent[2], extent[1]] : null,
  };
}

async function searchPhoton(query: string) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(MAX_RESULTS));
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(SEARCH_BIAS.latitude));
  url.searchParams.set("lon", String(SEARCH_BIAS.longitude));

  const response = await fetch(url, {
    headers: { "User-Agent": "photography-portfolio photo spots map" },
    signal: AbortSignal.timeout(PHOTON_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Place search failed (${response.status}).`,
    });
  }

  const { features } = photonResponseSchema.parse(await response.json());
  const places = features.map(toPlaceResult);

  // Photon often returns the same place twice: the same map object more than once (same id),
  // or a building and its entrance with the same name and address. Keep the first of each,
  // since the id is also the React key in the search dropdown and must be unique.
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  return places.filter((place) => {
    const label = `${place.name}|${place.description}`;
    if (seenIds.has(place.id) || seenLabels.has(label)) return false;
    seenIds.add(place.id);
    seenLabels.add(label);
    return true;
  });
}

export const placesRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(2).max(100) }))
    .query(async ({ input }): Promise<PlaceResult[]> => {
      if (UK_POSTCODE_PATTERN.test(input.query)) {
        const location = await lookupPostcode(input.query);

        if (location) {
          return [
            {
              id: `postcode-${location.postcode}`,
              name: location.postcode,
              description: "Postcode",
              latitude: location.latitude,
              longitude: location.longitude,
              bounds: null,
            },
          ];
        }
      }

      return searchPhoton(input.query);
    }),
});
