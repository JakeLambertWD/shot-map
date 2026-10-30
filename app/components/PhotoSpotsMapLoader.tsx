"use client";

import { Center, Loader } from "@mantine/core";
import dynamic from "next/dynamic";

// MapLibre needs `window`, so the map is only rendered in the browser.
const PhotoSpotsMap = dynamic(
  () => import("./PhotoSpotsMap").then((module) => module.PhotoSpotsMap),
  {
    ssr: false,
    loading: () => (
      <Center pos="fixed" inset={0}>
        <Loader color="yellow" />
      </Center>
    ),
  },
);

export function PhotoSpotsMapLoader() {
  return <PhotoSpotsMap />;
}
