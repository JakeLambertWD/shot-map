"use client";

import { Group, Text, UnstyledButton, useMantineTheme } from "@mantine/core";

// "12 of 95 spots" with a Clear button, shown above the bottom buttons while filtering.
export function FilterResultCount({
  shown,
  total,
  onClear,
}: {
  shown: number;
  total: number;
  onClear: () => void;
}) {
  const theme = useMantineTheme();

  return (
    <Group
      role="status"
      gap={10}
      wrap="nowrap"
      h={36}
      pl={14}
      pr={6}
      bg="teal.7"
      mx="auto"
      w="fit-content"
      style={{
        borderRadius: 18,
        border: `1px solid ${theme.colors.teal[4]}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <Text fz={13} c="teal.0">
        <Text component="strong" fz={13} fw={900} inherit>
          {shown}
        </Text>{" "}
        of {total} spots
      </Text>
      <UnstyledButton
        onClick={onClear}
        h={28}
        px={10}
        fz={12}
        fw={700}
        c="amber.5"
        bg="teal.5"
        style={{ borderRadius: 14 }}
      >
        Clear
      </UnstyledButton>
    </Group>
  );
}
