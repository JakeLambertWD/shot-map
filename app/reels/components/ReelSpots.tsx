"use client";

import {
  REEL_KIND_COPY,
  REEL_TYPE_KINDS,
  REEL_TYPE_STYLES,
} from "@/app/[spotId]/components/reels/Reels.constants";
import { api } from "@/app/providers";
import { TabChips } from "@/app/components/tab-chips/TabChips";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import {
  ActionIcon,
  Box,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronLeft, IconMovie } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { ReelSpotList } from "./ReelSpotList";
import {
  isReelSpotsTabId,
  mergeTabOrder,
  readStoredTab,
  REEL_SPOTS_TAB_STORAGE_KEY,
  type ReelSpotsTabId,
} from "./ReelSpots.constants";

// The Reels page: every spot with reel ideas, with the types planned there. Tabs narrow it to
// one reel type. Spots can be dragged into the order they'll be worked on; spots that get their
// first reel start at the top.
export function ReelSpots() {
  const { data: spots, isPending, isError, error } = api.reels.spots.useQuery();
  const utils = api.useUtils();
  const reorderSpots = api.reels.reorderSpots.useMutation();
  // Reopens the last tab, e.g. on coming back from a spot. The tabs only show once the spots
  // have loaded in the browser, so the server never renders a different tab.
  const [activeTab, setActiveTab] = useState<ReelSpotsTabId>(readStoredTab);

  function changeTab(tab: ReelSpotsTabId) {
    setActiveTab(tab);
    try {
      sessionStorage.setItem(REEL_SPOTS_TAB_STORAGE_KEY, tab);
    } catch {
      // Not remembering the tab is fine.
    }
  }

  // Shows the new order straight away, then saves it.
  function saveSpotOrder(spotIds: string[]) {
    utils.reels.spots.setData(undefined, (current) => {
      if (!current) return current;
      const byId = new Map(current.map((spot) => [spot.id, spot]));
      return spotIds.flatMap((id) => byId.get(id) ?? []);
    });
    reorderSpots.mutate(
      { spotIds },
      // On failure, put back the saved order.
      { onError: () => utils.reels.spots.invalidate() },
    );
  }

  const allSpots = spots ?? [];
  const reelsOfKind = (kind: (typeof REEL_TYPE_KINDS)[number]) =>
    allSpots.reduce(
      (total, spot) => total + (spot.kinds.find((row) => row.kind === kind)?.count ?? 0),
      0,
    );
  const reelTotal = allSpots.reduce((total, spot) => total + spot.reelCount, 0);

  const tabs = [
    { id: "all" as const, label: "All", count: reelTotal },
    ...REEL_TYPE_KINDS.map((kind) => ({
      id: kind,
      label: REEL_TYPE_STYLES[kind].label,
      count: reelsOfKind(kind),
    })),
  ];

  const tabSpots =
    activeTab === "all"
      ? allSpots
      : allSpots.filter((spot) => spot.kinds.some((row) => row.kind === activeTab));
  const tabReelCount = tabs.find((tab) => tab.id === activeTab)?.count ?? 0;

  return (
    <Container size="30rem" px={0} pb="xxl" w="100%">
      <Group justify="space-between" wrap="nowrap" px="xs" my="sm">
        <ActionIcon
          component={Link}
          href="/"
          aria-label="Back to map"
          variant="subtle"
          color="brown.0"
          size={44}
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <Title order={1} fz="lg" c="brown.0">
          Reels
        </Title>
        <Box w={44} />
      </Group>

      {isPending ? (
        <Center mih="50vh">
          <Loader color="yellow" />
        </Center>
      ) : isError ? (
        <Text c="red.5" px="md" role="alert">
          {error.message}
        </Text>
      ) : allSpots.length === 0 ? (
        <Stack mih="60vh" align="center" justify="center" gap="sm" px="xl" ta="center">
          <IconMovie size={40} stroke={1.5} color="var(--mantine-color-brown-2)" />
          <Text fw={700} c="brown.0">
            No reel ideas yet
          </Text>
          <Text fz="sm" c="brown.1">
            Add a reel on a spot’s Reels tab and it’ll show up here.
          </Text>
        </Stack>
      ) : (
        <Tabs
          value={activeTab}
          onChange={(tab) => isReelSpotsTabId(tab) && changeTab(tab)}
          variant="pills"
        >
          <TabChips tabs={tabs} value={activeTab} ariaLabel="Reel types" />

          <Tabs.Panel value={activeTab}>
            {tabSpots.length === 0 ? (
              <Center
                h={120}
                mx="md"
                bg="brown.7"
                bdrs="md"
                c="brown.1"
                fz="sm"
                ta="center"
                px="md"
              >
                {activeTab === "all" ? "No reel ideas yet" : REEL_KIND_COPY[activeTab].emptyText}
              </Center>
            ) : (
              <>
                <Text fz="sm" c="brown.1" px="md" pb="sm">
                  {tabSpots.length} {tabSpots.length === 1 ? "spot" : "spots"} · {tabReelCount} reel{" "}
                  {tabReelCount === 1 ? "idea" : "ideas"}
                </Text>
                <ReelSpotList
                  spots={tabSpots}
                  canReorder={CAN_EDIT_SPOTS}
                  onReorder={(tabIds) =>
                    saveSpotOrder(
                      mergeTabOrder(
                        allSpots.map((spot) => spot.id),
                        tabIds,
                      ),
                    )
                  }
                />
              </>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </Container>
  );
}
