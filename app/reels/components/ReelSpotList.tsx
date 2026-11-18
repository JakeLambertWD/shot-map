"use client";

import { REEL_TYPE_STYLES } from "@/app/[spotId]/components/reels/Reels.constants";
import { getSpotTabHref } from "@/app/[spotId]/components/SpotContentTabs.constants";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import { SortableSpotList } from "@/app/components/sortable-spots/SortableSpotList";
import { SpotThumbnail } from "@/app/components/sortable-spots/SpotThumbnail";
import type { ReelSpot } from "@/server/routers/reels";
import { Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";
import { formatReelCount, sortKindCounts, type ReelKindCount } from "./ReelSpots.constants";

type ReelSpotListProps = {
  spots: ReelSpot[];
  canReorder: boolean;
  // Called once a spot is dropped somewhere new, with every spot's id in the new order.
  onReorder: (spotIds: string[]) => void;
};

// The Reels page's spots, which can be dragged into the order they'll be worked on.
export function ReelSpotList({ spots, canReorder, onReorder }: ReelSpotListProps) {
  // Rows without a drag handle get a chevron instead.
  const showChevron = !canReorder || spots.length < 2;

  return (
    <SortableSpotList
      spots={spots}
      canReorder={canReorder}
      onReorder={onReorder}
      renderSpot={(spot) => (
        <UnstyledButton
          component={Link}
          href={getSpotTabHref(spot.id, "reels", "reels")}
          py="sm"
          flex={1}
          miw={0}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <SpotThumbnail coverImageUrl={spot.coverImageUrl} />

          <Stack gap={6} flex={1} miw={0}>
            <Group justify="space-between" align="baseline" wrap="nowrap" gap="sm">
              <Text fw={700} c="brown.0" truncate>
                {spot.title}
              </Text>
              <Text fz="xs" c="brown.1" style={{ flexShrink: 0 }}>
                {formatReelCount(spot.reelCount)}
              </Text>
            </Group>
            <Group gap={4} wrap="nowrap" c="brown.1">
              <IconMapPin size={14} aria-hidden style={{ flexShrink: 0 }} />
              <Text fz="xs" truncate>
                {formatSpotLocation(spot)}
              </Text>
            </Group>
            <Group gap={4}>
              {sortKindCounts(spot.kinds).map((kindCount) => (
                <ReelKindPill key={kindCount.kind} {...kindCount} />
              ))}
            </Group>
          </Stack>

          {showChevron && (
            <IconChevronRight
              size={18}
              color="var(--mantine-color-brown-2)"
              aria-hidden
              style={{ flexShrink: 0 }}
            />
          )}
        </UnstyledButton>
      )}
    />
  );
}

// A reel type and how many of it a spot has, like "Educational ×2", in that type's colours.
function ReelKindPill({ kind, count }: ReelKindCount) {
  const style = REEL_TYPE_STYLES[kind];

  return (
    <Text
      component="span"
      fz={11}
      fw={900}
      lh={1}
      px={8}
      py={4}
      bg={style.tint}
      c={style.text}
      style={{ borderRadius: 10, border: `1px solid ${style.color}` }}
    >
      {count > 1 ? `${style.label} ×${count}` : style.label}
    </Text>
  );
}
