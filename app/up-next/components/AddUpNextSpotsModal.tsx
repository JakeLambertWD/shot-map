"use client";

import { api } from "@/app/providers";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import { SpotThumbnail } from "@/app/components/sortable-spots/SpotThumbnail";
import { Center, Loader, Modal, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { matchesSpotSearch } from "./UpNext.constants";

type AddUpNextSpotsModalProps = {
  opened: boolean;
  onClose: () => void;
  // Spots already on the list, which the picker leaves out.
  upNextSpotIds: string[];
  onAdd: (spotId: string) => Promise<void>;
  addingSpotId: string | null;
};

// Picks spots to add to Up next. It stays open so several can be added in a row; each one
// leaves the picker once it's added.
export function AddUpNextSpotsModal({
  opened,
  onClose,
  upNextSpotIds,
  onAdd,
  addingSpotId,
}: AddUpNextSpotsModalProps) {
  const { data: allSpots, isPending, isError } = api.spots.list.useQuery();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const spots = (allSpots ?? [])
    .filter((spot) => !upNextSpotIds.includes(spot.id))
    .filter((spot) => matchesSpotSearch(spot, search))
    .sort((a, b) => a.title.localeCompare(b.title));

  async function add(spotId: string) {
    setError(null);
    try {
      await onAdd(spotId);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Couldn't add that spot.");
    }
  }

  function close() {
    setSearch("");
    setError(null);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={close} title="Add to Up next" size="lg">
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

        {error && (
          <Text fz="sm" c="red.5" role="alert">
            {error}
          </Text>
        )}

        {isPending ? (
          <Center h={120}>
            <Loader color="yellow" size="sm" />
          </Center>
        ) : isError ? (
          <Text fz="sm" c="red.5" role="alert">
            Couldn&apos;t load spots.
          </Text>
        ) : spots.length === 0 ? (
          <Center h={120} c="brown.1" fz="sm" ta="center" px="md">
            {search.trim() ? "No spots match that search" : "Every spot is already on Up next"}
          </Center>
        ) : (
          <Stack gap={0} component="ul" m={0} p={0} style={{ listStyle: "none" }}>
            {spots.map((spot) => (
              <li key={spot.id}>
                <UnstyledButton
                  onClick={() => add(spot.id)}
                  disabled={addingSpotId !== null}
                  aria-label={`Add ${spot.title}`}
                  w="100%"
                  py="xs"
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <SpotThumbnail coverImageUrl={spot.coverImageUrl} />
                  <Stack gap={4} flex={1} miw={0}>
                    <Text fw={700} c="brown.0" truncate>
                      {spot.title}
                    </Text>
                    <Text fz="xs" c="brown.1" truncate>
                      {formatSpotLocation(spot)}
                    </Text>
                  </Stack>
                  <Center w={32} style={{ flexShrink: 0 }}>
                    {addingSpotId === spot.id ? (
                      <Loader color="yellow" size="xs" />
                    ) : (
                      <IconPlus size={20} color="var(--mantine-color-yellow-5)" aria-hidden />
                    )}
                  </Center>
                </UnstyledButton>
              </li>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
