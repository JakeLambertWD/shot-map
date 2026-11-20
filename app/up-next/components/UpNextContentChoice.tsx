"use client";

import type { UpNextContent } from "@/lib/photo-spots";
import { Center, Group, Loader, Stack, Text, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import { UP_NEXT_CONTENT_OPTIONS } from "./UpNext.constants";

type UpNextContentChoiceProps = {
  spotTitle: string;
  // Saves the choice. Throwing shows the error under the options.
  onPick: (content: UpNextContent) => Promise<void>;
};

// Asks what a spot is being shot for before it goes on Up next: Carousel, Reel or Both, as big
// buttons. The tapped one shows a loader while it saves.
export function UpNextContentChoice({ spotTitle, onPick }: UpNextContentChoiceProps) {
  const [picking, setPicking] = useState<UpNextContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(content: UpNextContent) {
    setPicking(content);
    setError(null);
    try {
      await onPick(content);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "Couldn't add that spot.");
    } finally {
      setPicking(null);
    }
  }

  return (
    <Stack gap="sm">
      <Text fz="sm" c="teal.1">
        What are you shooting at {spotTitle}?
      </Text>
      {UP_NEXT_CONTENT_OPTIONS.map((option) => (
        <UnstyledButton
          key={option.value}
          onClick={() => pick(option.value)}
          disabled={picking !== null}
          mih={60}
          px="md"
          py="sm"
          bdrs="md"
          bg="teal.6"
          style={{
            border: "1px solid var(--mantine-color-teal-4)",
            opacity: picking !== null && picking !== option.value ? 0.5 : 1,
          }}
        >
          <Group wrap="nowrap" gap="md">
            <Group gap={6} wrap="nowrap" w={48} c="amber.5" aria-hidden>
              {option.icons.map((Icon, index) => (
                <Icon key={index} size={20} stroke={1.75} />
              ))}
            </Group>
            <Stack gap={2} flex={1}>
              <Text fw={700} c="teal.0">
                {option.label}
              </Text>
              <Text fz="xs" c="teal.1">
                {option.description}
              </Text>
            </Stack>
            {picking === option.value && (
              <Center w={20}>
                <Loader color="amber" size="xs" />
              </Center>
            )}
          </Group>
        </UnstyledButton>
      ))}
      {error && (
        <Text fz="sm" c="red.5" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}
