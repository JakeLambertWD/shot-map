// UK postcode lookups via postcodes.io (free, no API key, allows browser requests).
const POSTCODES_API_URL = "https://api.postcodes.io";

export type PostcodeLocation = {
  postcode: string;
  latitude: number;
  longitude: number;
};

type PostcodeApiResult = {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
};

export async function lookupPostcode(postcode: string): Promise<PostcodeLocation | null> {
  const response = await fetch(
    `${POSTCODES_API_URL}/postcodes/${encodeURIComponent(postcode.trim())}`,
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Postcode lookup failed (${response.status})`);

  const { result } = (await response.json()) as { result: PostcodeApiResult };
  if (result.latitude === null || result.longitude === null) return null;

  return { postcode: result.postcode, latitude: result.latitude, longitude: result.longitude };
}

export async function findNearestPostcode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const response = await fetch(
    `${POSTCODES_API_URL}/postcodes?lat=${latitude}&lon=${longitude}&limit=1&radius=500`,
  );

  if (!response.ok) return null;

  const { result } = (await response.json()) as { result: PostcodeApiResult[] | null };
  return result?.[0]?.postcode ?? null;
}
