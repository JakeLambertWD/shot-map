"use client";

import type { SpotDetail } from "@/server/routers/spots";
import { Box, Stack } from "@mantine/core";
import type { ReactNode } from "react";
import { ShowcaseCarouselSection } from "./ShowcaseCarouselSection";
import { SpotPhotoTab } from "./SpotPhotoTab";

type ShowcaseCarouselsProps = {
  spot: SpotDetail;
  // Status badge and gear, shown with the weather under the first carousel.
  labels: ReactNode;
  // Shown under the carousels.
  children?: ReactNode;
};

// The Showcase tab: the spot's carousel of photos, shown on its own with no title. A spot that
// still has more than one carousel from before shows each with its title and menu, so the
// extras can be deleted.
export function ShowcaseCarousels({ spot, labels, children }: ShowcaseCarouselsProps) {
  const [onlyCarousel] = spot.carousels;

  if (spot.carousels.length === 1) {
    return (
      <SpotPhotoTab
        spot={spot}
        photos={onlyCarousel.photos}
        kind="showcase"
        carouselId={onlyCarousel.id}
        labels={labels}
      >
        {children}
      </SpotPhotoTab>
    );
  }

  return (
    <Stack gap="lg">
      {spot.carousels.map((carousel, index) => (
        <ShowcaseCarouselSection
          key={carousel.id ?? "placeholder"}
          spot={spot}
          carousel={carousel}
          labels={index === 0 ? labels : undefined}
          canDelete={spot.carousels.length > 1}
        />
      ))}

      {children && <Box px="md">{children}</Box>}
    </Stack>
  );
}
