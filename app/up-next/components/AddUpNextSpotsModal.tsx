"use client";

import { api } from "@/app/providers";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import { SpotThumbnail } from "@/app/components/sortable-spots/SpotThumbnail";
import type { UpNextContent } from "@/lib/photo-spots";
import {
  Button,
  Center,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronLeft, IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { matchesSpotSearch } from "./UpNext.constants";
import { UpNextContentChoice } from "./UpNextContentChoice";

type AddUpNextSpotsModalProps = {
  opened: boolean;
  onClose: () => void;
  // Spots already on the list, which the picker leaves out.
  upNextSpotIds: string[];
  onAdd: (spotId: string, content: UpNextContent) => Promise<void>;
};

// Picks spots to add to Up next. Tapping a spot asks what it's being shot for (Carousel, Reel or
// Both), then adds it and goes back to the list, so several can be added in a row; each one leaves
// the list once it's added.
export function AddUpNextSpotsModal({
  opened,
  onClose,
  upNextSpotIds,
  onAdd,
}: AddUpNextSpotsModalProps) {
  const { data: allSpots, isPending, isError } = api.spots.list.useQuery();
  const [search, setSearch] = useState("");
  // The spot whose content is being chosen; null shows the list.
  const [choosingSpot, setChoosingSpot] = useState<{ id: string; title: string } | null>(null);

  const spots = (allSpots ?? [])
    .filter((spot) => !upNextSpotIds.includes(spot.id))
    .filter((spot) => matchesSpotSearch(spot, search))
    .sort((a, b) => a.title.localeCompare(b.title));

  function close() {
    setSearch("");
    setChoosingSpot(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={choosingSpot ? "What are you shooting?" : "Add to Up next"}
      size="lg"
    >
      {choosingSpot ? (
        <Stack gap="md">
          <UpNextContentChoice
            spotTitle={choosingSpot.title}
            onPick={async (content) => {
              await onAdd(choosingSpot.id, content);
              setChoosingSpot(null);
            }}
          />
          <Button
            variant="subtle"
            color="teal.0"
            leftSection={<IconChevronLeft size={18} />}
            onClick={() => setChoosingSpot(null)}
            style={{ alignSelf: "flex-start" }}
          >
            Back to spots
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          <TextInput
            size="md"
            placeholder="Search spots"
            aria-label="Search spots"
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            data-autofocus
          />

          {isPending ? (
            <Center h={120}>
              <Loader color="amber" size="sm" />
            </Center>
          ) : isError ? (
            <Text fz="sm" c="red.5" role="alert">
              Couldn&apos;t load spots.
            </Text>
          ) : spots.length === 0 ? (
            <Center h={120} c="teal.1" fz="sm" ta="center" px="md">
              {search.trim() ? "No spots match that search" : "Every spot is already on Up next"}
            </Center>
          ) : (
            <Stack gap={0} component="ul" m={0} p={0} style={{ listStyle: "none" }}>
              {spots.map((spot) => (
                <li key={spot.id}>
                  <UnstyledButton
                    onClick={() => setChoosingSpot({ id: spot.id, title: spot.title })}
                    aria-label={`Add ${spot.title}`}
                    w="100%"
                    py="xs"
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <SpotThumbnail coverImageUrl={spot.coverImageUrl} />
                    <Stack gap={4} flex={1} miw={0}>
                      <Text fw={700} c="teal.0" truncate>
                        {spot.title}
                      </Text>
                      <Text fz="xs" c="teal.1" truncate>
                        {formatSpotLocation(spot)}
                      </Text>
                    </Stack>
                    <Center w={32} style={{ flexShrink: 0 }}>
                      <IconPlus size={20} color="var(--mantine-color-amber-5)" aria-hidden />
                    </Center>
                  </UnstyledButton>
                </li>
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  );
}
