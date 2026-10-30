"use client";

import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotReelClip } from "@/server/routers/reels";
import { Center, Group, Text, UnstyledButton } from "@mantine/core";
import { CLIP_DIVIDER } from "./Reels.constants";

type ReelClipRowProps = {
  clip: SpotReelClip;
  clipNumber: number;
  onEdit: () => void;
};

export function ReelClipRow({ clip, clipNumber, onEdit }: ReelClipRowProps) {
  const row = (
    <Group gap="sm" wrap="nowrap" align="flex-start" py="xs" style={{ borderTop: CLIP_DIVIDER }}>
      <Center
        w={22}
        h={22}
        bdrs="xl"
        bg="brown.4"
        c="yellow.5"
        fz={11}
        fw={700}
        style={{ flexShrink: 0 }}
      >
        {clipNumber}
      </Center>
      <Text flex={1} fz="sm" lh={1.35} c="brown.0" style={{ whiteSpace: "pre-line" }}>
        {clip.description}
      </Text>
      {clip.durationSeconds && (
        <Text ff="monospace" fz={11} c="brown.1" pt={3}>
          {clip.durationSeconds}s
        </Text>
      )}
    </Group>
  );

  if (!CAN_EDIT_SPOTS) return <li>{row}</li>;

  return (
    <li>
      <UnstyledButton w="100%" ta="left" onClick={onEdit}>
        {row}
      </UnstyledButton>
    </li>
  );
}
