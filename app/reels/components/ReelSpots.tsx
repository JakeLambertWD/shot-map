"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import {
  ActionIcon,
  Box,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronLeft, IconMovie } from "@tabler/icons-react";
import Link from "next/link";
import { ReelSpotList } from "./ReelSpotList";

// The Reels page: every spot with reel ideas, with the types planned there. Spots can be dragged
// into the order they'll be worked on; spots that get their first reel start at the top.
export function ReelSpots() {
  const { data: spots, isPending, isError, error } = api.reels.spots.useQuery();
  const utils = api.useUtils();
  const reorderSpots = api.reels.reorderSpots.useMutation();

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

  const reelTotal = spots?.reduce((total, spot) => total + spot.reelCount, 0) ?? 0;

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
      ) : spots.length === 0 ? (
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
        <>
          <Text fz="sm" c="brown.1" px="md" pb="sm">
            {spots.length} {spots.length === 1 ? "spot" : "spots"} · {reelTotal} reel{" "}
            {reelTotal === 1 ? "idea" : "ideas"}
          </Text>
          <ReelSpotList spots={spots} canReorder={CAN_EDIT_SPOTS} onReorder={saveSpotOrder} />
        </>
      )}
    </Container>
  );
}
