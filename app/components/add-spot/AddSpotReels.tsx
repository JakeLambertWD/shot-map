"use client";

import { REEL_KIND_COPY, REEL_TYPE_KINDS } from "@/app/[spotId]/components/reels/Reels.constants";
import { ReelTypePill } from "@/app/[spotId]/components/reels/ReelTypePill";
import { MAX_SPOT_REELS, type ReelKind } from "@/lib/photo-spots";
import { ActionIcon, Button, Group, Input, Paper, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useRef } from "react";

export type DraftReel = {
  id: string;
  kind: ReelKind;
  title: string;
  // The Instagram creator, without its @.
  creator: string;
};

type AddSpotReelsProps = {
  reels: DraftReel[];
  onChange: (reels: DraftReel[]) => void;
  disabled: boolean;
};

// Reel ideas added along with a new spot. Ideas left without a name aren't saved.
export function AddSpotReels({ reels, onChange, disabled }: AddSpotReelsProps) {
  // crypto.randomUUID() only exists on HTTPS, which breaks testing over the local network.
  const nextReelId = useRef(0);

  function addReel() {
    onChange([
      ...reels,
      { id: `reel-${nextReelId.current++}`, kind: REEL_TYPE_KINDS[0], title: "", creator: "" },
    ]);
  }

  function updateReel(id: string, changes: Partial<DraftReel>) {
    onChange(reels.map((reel) => (reel.id === id ? { ...reel, ...changes } : reel)));
  }

  function removeReel(id: string) {
    onChange(reels.filter((reel) => reel.id !== id));
  }

  return (
    <Input.Wrapper
      label="Reel ideas"
      description="Plan clips for each one later from the spot's Reels tab."
    >
      <Stack gap="sm" mt="xs">
        {reels.map((reel, index) => (
          <Paper key={reel.id} withBorder radius="md" p="sm">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap">
                <ReelTypePill kind={reel.kind} onChange={(kind) => updateReel(reel.id, { kind })} />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`Remove reel idea ${index + 1}`}
                  onClick={() => removeReel(reel.id)}
                  disabled={disabled}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
              <TextInput
                size="md"
                aria-label={`Reel idea ${index + 1}`}
                placeholder={REEL_KIND_COPY[reel.kind].placeholder}
                value={reel.title}
                onChange={(event) => updateReel(reel.id, { title: event.currentTarget.value })}
                maxLength={160}
                autoFocus={!reel.title}
              />
              <TextInput
                size="md"
                aria-label={`Creator for reel idea ${index + 1} (optional)`}
                placeholder="Creator (optional)"
                leftSection={
                  <Text component="span" c="dimmed" fw={700} aria-hidden>
                    @
                  </Text>
                }
                value={reel.creator}
                onChange={(event) =>
                  updateReel(reel.id, { creator: event.currentTarget.value.replace(/^@+/, "") })
                }
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={60}
              />
            </Stack>
          </Paper>
        ))}

        <Button
          variant="default"
          leftSection={<IconPlus size={18} />}
          onClick={addReel}
          disabled={disabled || reels.length >= MAX_SPOT_REELS}
        >
          {reels.length === 0 ? "Add reel idea" : "Add another reel idea"}
        </Button>
      </Stack>
    </Input.Wrapper>
  );
}
