"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { TrialReel } from "@/server/routers/trialReels";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconDots, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { RemoveTrialReelSheet } from "./RemoveTrialReelSheet";
import { TrialReelLibraryPicker } from "./TrialReelLibraryPicker";
import { TrialReelSheet } from "./TrialReelSheet";
import { getTrialReelLabel, TrialReelTileFace } from "./TrialReelTileFace";

type TrialReelsGridProps = {
  spotId: string;
  spotTitle: string;
};

// A spot's Trial Reels tab: the links picked for it from the shared library, as a reels-style
// grid. Tapping a tile opens the reel in Instagram.
export function TrialReelsGrid({ spotId, spotTitle }: TrialReelsGridProps) {
  const reelsQuery = api.trialReels.list.useQuery({ spotId });
  const [isPicking, setIsPicking] = useState(false);
  const [optionsFor, setOptionsFor] = useState<TrialReel | null>(null);
  const [editing, setEditing] = useState<TrialReel | null>(null);

  const reels = reelsQuery.data ?? [];

  return (
    <Stack gap="sm" px="md" pt="xs" pb="xxl">
      <Group justify="space-between" mih={36}>
        <Text component="h2" ff="monospace" fz="xs" c="brown.1" tt="uppercase" lts="0.08em">
          Trial reel ideas · {reels.length}
        </Text>
        {CAN_EDIT_SPOTS && (
          <Button
            size="sm"
            leftSection={<IconPlus size={16} stroke={2.5} />}
            onClick={() => setIsPicking(true)}
            autoContrast
          >
            Add link
          </Button>
        )}
      </Group>

      {reelsQuery.isPending ? (
        <Center h={160}>
          <Loader color="yellow" size="sm" />
        </Center>
      ) : reelsQuery.isError ? (
        <Text fz="sm" c="red.4" role="alert">
          Couldn&apos;t load the trial reels.
        </Text>
      ) : reels.length === 0 ? (
        <Center h={160} c="brown.1" fz="sm" ta="center">
          No trial reel ideas yet. Add one from your library, or paste a new link.
        </Center>
      ) : (
        <SimpleGrid cols={3} spacing={4} component="ul" m={0} p={0} style={{ listStyle: "none" }}>
          {reels.map((reel, index) => {
            const label = getTrialReelLabel(reel);
            return (
              <Box
                key={reel.id}
                component="li"
                pos="relative"
                style={{ aspectRatio: "9 / 16", borderRadius: 4, overflow: "hidden" }}
              >
                <Box
                  component="a"
                  href={reel.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${label}, ${index + 1} of ${reels.length}, in Instagram`}
                  pos="absolute"
                  inset={0}
                  style={{ display: "block" }}
                >
                  <TrialReelTileFace reel={reel} />
                </Box>
                {CAN_EDIT_SPOTS && (
                  <ActionIcon
                    aria-label={`Options for ${label}, ${index + 1} of ${reels.length}`}
                    onClick={() => setOptionsFor(reel)}
                    pos="absolute"
                    top={4}
                    right={4}
                    size={32}
                    radius="xl"
                    variant="filled"
                    color="rgba(0, 0, 0, 0.55)"
                  >
                    <IconDots size={18} color="var(--mantine-color-brown-0)" />
                  </ActionIcon>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      <TrialReelLibraryPicker
        opened={isPicking}
        onClose={() => setIsPicking(false)}
        spotId={spotId}
        usedIds={reels.map((reel) => reel.id)}
      />
      <RemoveTrialReelSheet
        reel={optionsFor}
        spotId={spotId}
        spotTitle={spotTitle}
        onClose={() => setOptionsFor(null)}
        onEdit={(reel) => {
          setOptionsFor(null);
          setEditing(reel);
        }}
      />
      <TrialReelSheet opened={editing !== null} reel={editing} onClose={() => setEditing(null)} />
    </Stack>
  );
}
