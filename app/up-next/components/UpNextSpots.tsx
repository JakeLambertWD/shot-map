"use client";

import { getSpotTabHref } from "@/app/[spotId]/components/SpotContentTabs.constants";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import { SortableSpotList } from "@/app/components/sortable-spots/SortableSpotList";
import { SpotThumbnail } from "@/app/components/sortable-spots/SpotThumbnail";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronLeft, IconListNumbers, IconPlus, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useUpNext } from "../useUpNext";
import { AddUpNextSpotsModal } from "./AddUpNextSpotsModal";
import { formatSpotConditions } from "./UpNext.constants";

// The Up next page: spots to shoot in the near future. Spots are added from here or from a
// spot's menu, join the bottom of the list, and can be dragged into the order they'll be shot.
export function UpNextSpots() {
  const upNext = useUpNext();
  const { isPending, isError, error } = upNext.list;
  const { spots } = upNext;
  const [isAdding, setIsAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function remove(spotId: string) {
    setRemoveError(null);
    try {
      await upNext.remove(spotId);
    } catch (removeFailure) {
      setRemoveError(
        removeFailure instanceof Error ? removeFailure.message : "Couldn't remove that spot.",
      );
    }
  }

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
          Up next
        </Title>
        {CAN_EDIT_SPOTS ? (
          <ActionIcon
            aria-label="Add spots to Up next"
            variant="subtle"
            color="yellow.5"
            size={44}
            onClick={() => setIsAdding(true)}
          >
            <IconPlus size={24} />
          </ActionIcon>
        ) : (
          <Box w={44} />
        )}
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
          <IconListNumbers size={40} stroke={1.5} color="var(--mantine-color-brown-2)" />
          <Text fw={700} c="brown.0">
            Nothing up next yet
          </Text>
          <Text fz="sm" c="brown.1">
            Add the spots you want to shoot soon, then drag them into order.
          </Text>
          {CAN_EDIT_SPOTS && (
            <Button
              mt="xs"
              leftSection={<IconPlus size={18} />}
              onClick={() => setIsAdding(true)}
              autoContrast
            >
              Add spots
            </Button>
          )}
        </Stack>
      ) : (
        <>
          <Text fz="sm" c="brown.1" px="md" pb="sm">
            {spots.length} {spots.length === 1 ? "spot" : "spots"} to shoot
          </Text>
          {removeError && (
            <Text fz="sm" c="red.5" px="md" pb="sm" role="alert">
              {removeError}
            </Text>
          )}
          <SortableSpotList
            spots={spots}
            canReorder={CAN_EDIT_SPOTS}
            onReorder={upNext.saveOrder}
            renderSpot={(spot) => (
              <>
                <Group
                  renderRoot={(props) => (
                    <Link href={getSpotTabHref(spot.id, "showcase", "up-next")} {...props} />
                  )}
                  wrap="nowrap"
                  gap={12}
                  py="sm"
                  flex={1}
                  miw={0}
                  td="none"
                >
                  <SpotThumbnail coverImageUrl={spot.coverImageUrl} />
                  <Stack gap={6} flex={1} miw={0}>
                    <Text fw={700} c="brown.0" truncate>
                      {spot.title}
                    </Text>
                    <Text fz="xs" c="brown.1" truncate>
                      {formatSpotLocation(spot)}
                    </Text>
                    <Text fz="sm" lh={1}>
                      {formatSpotConditions(spot)}
                    </Text>
                  </Stack>
                </Group>
                {CAN_EDIT_SPOTS && (
                  <ActionIcon
                    aria-label={`Remove ${spot.title} from Up next`}
                    variant="subtle"
                    color="brown.1"
                    size={44}
                    onClick={() => remove(spot.id)}
                    loading={upNext.removingSpotId === spot.id}
                    style={{ flexShrink: 0 }}
                  >
                    <IconX size={18} />
                  </ActionIcon>
                )}
              </>
            )}
          />
        </>
      )}

      {CAN_EDIT_SPOTS && (
        <AddUpNextSpotsModal
          opened={isAdding}
          onClose={() => setIsAdding(false)}
          upNextSpotIds={spots.map((spot) => spot.id)}
          onAdd={upNext.add}
          addingSpotId={upNext.addingSpotId}
        />
      )}
    </Container>
  );
}
