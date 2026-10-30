import { Pill } from "@mantine/core";
import { SPOT_TAG_EMOJIS } from "./AddSpot.constants";

// Selected weather shows as just its emoji; options without one fall back to their label.
export function WeatherPill({ value }: { value: string }) {
  const label = value.replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <Pill aria-label={label} title={label}>
      {SPOT_TAG_EMOJIS[value] ?? label}
    </Pill>
  );
}
