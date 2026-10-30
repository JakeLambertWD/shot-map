"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS, type ReelKind } from "@/lib/photo-spots";
import { Button, Center, Group, Loader, Paper, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { REEL_CARD_BORDER, REEL_KIND_COPY, REELS_TAB_COPY } from "./Reels.constants";
import { ReelCard } from "./ReelCard";

type ReelsPanelProps = {
  spotId: string;
  // The reel types this tab lists: several for the Reels tab, just "pov" for Trial Reels.
  // New reels start as the first one.
  kinds: readonly ReelKind[];
};

// Reel ideas for one tab of a spot: each card opens to show its clip-by-clip breakdown. With
// several types, each card shows its type as a pill that can be changed.
export function ReelsPanel({ spotId, kinds }: ReelsPanelProps) {
  const utils = api.useUtils();
  const kind = kinds[0];
  const isMixed = kinds.length > 1;
  const copy = isMixed ? REELS_TAB_COPY : REEL_KIND_COPY[kind];
  const reelsQuery = api.reels.list.useQuery({ spotId, kinds: [...kinds] });
  const [openReelId, setOpenReelId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string | null>(null);

  const createReel = api.reels.create.useMutation({
    onSuccess: async ({ id }) => {
      await utils.reels.list.invalidate({ spotId });
      setNewTitle(null);
      setOpenReelId(id);
    },
  });

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newTitle?.trim()) createReel.mutate({ spotId, kind, title: newTitle });
  }

  const reels = reelsQuery.data ?? [];

  return (
    <Stack gap="sm" px="md" pt="xs" pb="xxl">
      <Group justify="space-between" mih={36}>
        <Text component="h2" ff="monospace" fz="xs" c="brown.1" tt="uppercase" lts="0.08em">
          Reel ideas · {reels.length}
        </Text>
        {CAN_EDIT_SPOTS && newTitle === null && (
          <Button
            size="sm"
            leftSection={<IconPlus size={16} stroke={2.5} />}
            onClick={() => setNewTitle("")}
            autoContrast
          >
            New reel
          </Button>
        )}
      </Group>

      {newTitle !== null && (
        <Paper bg="brown.6" radius="md" p="sm" style={{ border: REEL_CARD_BORDER }}>
          <form onSubmit={handleCreate}>
            <Stack gap="xs">
              <TextInput
                label="Reel idea"
                placeholder={copy.placeholder}
                value={newTitle}
                onChange={(event) => setNewTitle(event.currentTarget.value)}
                maxLength={160}
                error={createReel.error?.message}
                autoFocus
              />
              <Group gap="xs" justify="flex-end">
                <Button
                  variant="default"
                  onClick={() => setNewTitle(null)}
                  disabled={createReel.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createReel.isPending}
                  disabled={!newTitle.trim()}
                  autoContrast
                >
                  Add reel
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      )}

      {reelsQuery.isPending ? (
        <Center h={120}>
          <Loader color="yellow" size="sm" />
        </Center>
      ) : reelsQuery.isError ? (
        <Text fz="sm" c="red.5" role="alert">
          Couldn&apos;t load reel ideas.
        </Text>
      ) : reels.length === 0 && newTitle === null ? (
        <Center h={120} bg="brown.7" bdrs="md" c="brown.1" fz="sm" ta="center" px="md">
          {copy.emptyText}
        </Center>
      ) : (
        reels.map((reel) => (
          <ReelCard
            key={reel.id}
            spotId={spotId}
            reel={reel}
            expanded={openReelId === reel.id}
            onToggle={() => setOpenReelId((current) => (current === reel.id ? null : reel.id))}
            showType={isMixed}
          />
        ))
      )}
    </Stack>
  );
}
