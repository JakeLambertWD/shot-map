"use client";

import { api } from "@/app/providers";
import {
  Box,
  Button,
  Center,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { TrialReelSheet } from "./TrialReelSheet";
import { getTrialReelLabel, TrialReelTileFace } from "./TrialReelTileFace";

type TrialReelLibraryPickerProps = {
  opened: boolean;
  onClose: () => void;
  spotId: string;
  // Ids of the links already on this spot; they can't be picked again.
  usedIds: string[];
};

// Full-screen library of every trial reel link. Pick links to add to this spot, or add a new
// one, which joins the library (selected, ready to add).
export function TrialReelLibraryPicker({
  opened,
  onClose,
  spotId,
  usedIds,
}: TrialReelLibraryPickerProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: "slide-up", duration: 200 }}
      styles={{ content: { backgroundColor: "var(--mantine-color-body)" } }}
    >
      {/* Remounted on each open so the selection starts empty. */}
      {opened && <PickerBody onClose={onClose} spotId={spotId} usedIds={usedIds} />}
    </Modal>
  );
}

function PickerBody({ onClose, spotId, usedIds }: Omit<TrialReelLibraryPickerProps, "opened">) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const libraryQuery = api.trialReels.library.useQuery();
  const addToSpot = api.trialReels.addToSpot.useMutation({
    onSuccess: async () => {
      await utils.trialReels.invalidate();
      onClose();
    },
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const used = useMemo(() => new Set(usedIds), [usedIds]);
  const library = libraryQuery.data ?? [];

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((other) => other !== id) : [...current, id],
    );
  }

  return (
    <Stack gap={0} h="100dvh">
      <Box
        component="header"
        h={56}
        px={8}
        style={{
          flex: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderBottom: `1px solid ${theme.colors.brown[5]}`,
        }}
      >
        <UnstyledButton
          onClick={onClose}
          h={44}
          px={8}
          fz={15}
          fw={700}
          c="brown.0"
          style={{ justifySelf: "start" }}
        >
          Cancel
        </UnstyledButton>
        <Title order={2} fz={16} fw={600} c="brown.0">
          Trial reels
        </Title>
        <Button
          onClick={() => addToSpot.mutate({ spotId, ids: selected })}
          disabled={selected.length === 0}
          loading={addToSpot.isPending}
          radius="xl"
          h={36}
          px={14}
          fz={14}
          fw={900}
          autoContrast
          style={{ justifySelf: "end" }}
        >
          {selected.length > 0 ? `Add ${selected.length}` : "Add"}
        </Button>
      </Box>

      <Box px="md" pt="sm" pb={4} style={{ flex: "none" }}>
        <Button
          fullWidth
          h={44}
          radius="sm"
          variant="default"
          leftSection={<IconPlus size={18} color={theme.colors.yellow[5]} />}
          onClick={() => setIsAddingNew(true)}
          styles={{
            root: {
              backgroundColor: theme.colors.brown[6],
              borderColor: theme.colors.brown[4],
              color: theme.colors.brown[0],
            },
          }}
        >
          Paste a new link
        </Button>
        {addToSpot.error && (
          <Text fz="sm" c="red.4" mt={6} role="alert">
            {addToSpot.error.message}
          </Text>
        )}
      </Box>

      <Box px="md" pt="sm" pb="xl" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {libraryQuery.isPending ? (
          <Center h={160}>
            <Loader color="yellow" size="sm" />
          </Center>
        ) : library.length === 0 ? (
          <Center h={160} c="brown.1" fz="sm" ta="center">
            No trial reel links yet. Paste your first one above.
          </Center>
        ) : (
          <SimpleGrid cols={3} spacing={4}>
            {library.map((reel) => {
              const isUsed = used.has(reel.id);
              const order = selected.indexOf(reel.id);
              const isSelected = order !== -1;
              return (
                <UnstyledButton
                  key={reel.id}
                  aria-pressed={isSelected}
                  aria-label={`${getTrialReelLabel(reel)}${isUsed ? ", already on this spot" : ""}`}
                  disabled={isUsed || addToSpot.isPending}
                  onClick={() => toggle(reel.id)}
                  pos="relative"
                  style={{
                    aspectRatio: "9 / 16",
                    borderRadius: 4,
                    overflow: "hidden",
                    opacity: isUsed ? 0.4 : 1,
                  }}
                >
                  <TrialReelTileFace reel={reel} />
                  {isSelected && (
                    <Box
                      aria-hidden
                      pos="absolute"
                      inset={0}
                      style={{
                        borderRadius: 4,
                        boxShadow: `inset 0 0 0 3px ${theme.colors.yellow[5]}`,
                      }}
                    />
                  )}
                  {isUsed ? (
                    <Text
                      component="span"
                      pos="absolute"
                      left={4}
                      top={4}
                      fz={10}
                      fw={700}
                      c="brown.0"
                      px={6}
                      style={{ borderRadius: 8, backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                    >
                      On this spot
                    </Text>
                  ) : (
                    <Center
                      aria-hidden
                      pos="absolute"
                      top={5}
                      right={5}
                      w={22}
                      h={22}
                      fz={11}
                      fw={900}
                      c="brown.9"
                      style={{
                        borderRadius: "50%",
                        boxSizing: "border-box",
                        backgroundColor: isSelected
                          ? theme.colors.yellow[5]
                          : "rgba(0, 0, 0, 0.35)",
                        border: isSelected ? "none" : `1.5px solid ${theme.colors.brown[0]}`,
                      }}
                    >
                      {isSelected &&
                        (selected.length > 1 ? order + 1 : <IconCheck size={13} stroke={3.5} />)}
                    </Center>
                  )}
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      <TrialReelSheet
        opened={isAddingNew}
        reel={null}
        onClose={() => setIsAddingNew(false)}
        // A new link starts selected, unless it was already in the library and on this spot.
        onSaved={(id) =>
          !used.has(id) &&
          setSelected((current) => (current.includes(id) ? current : [...current, id]))
        }
      />
    </Stack>
  );
}
