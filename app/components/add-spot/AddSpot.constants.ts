export const SUGGESTED_SPOT_TAGS = [
  "any",
  "sunrise",
  "rain",
  "sunset",
  "blue hour",
  "night",
  "fog",
  "snow",
] as const;

export const SPOT_TAG_EMOJIS: Record<string, string> = {
  sunrise: "🌅",
  sunset: "🌇",
  "blue hour": "🏙️",
  night: "🌙",
  fog: "🌫️",
  rain: "🌧️",
  snow: "❄️",
  any: "🌍",
};

export function formatSpotTag(tag: string) {
  const label = tag.replace(/\b\w/g, (letter) => letter.toUpperCase());
  const emoji = SPOT_TAG_EMOJIS[tag];
  return emoji ? `${label} ${emoji}` : label;
}
