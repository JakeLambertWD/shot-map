"use client";

import { Group, Text, UnstyledButton, useMantineTheme } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { getActiveFilterChips, type SpotFilters } from "./SpotFilters.constants";

// Removable chips for each filter that's on, shown under the search bar.
export function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: SpotFilters;
  onChange: (filters: SpotFilters) => void;
}) {
  const theme = useMantineTheme();
  const chips = getActiveFilterChips(filters);
  if (chips.length === 0) return null;

  return (
    <Group
      gap={8}
      wrap="nowrap"
      style={{ overflowX: "auto", scrollbarWidth: "none", pointerEvents: "auto" }}
    >
      {chips.map((chip) => (
        <UnstyledButton
          key={chip.key}
          aria-label={`Remove ${chip.label} filter`}
          onClick={() => onChange(chip.remove(filters))}
          h={36}
          pl={12}
          pr={8}
          fz={13}
          fw={700}
          c="brown.0"
          bg="brown.5"
          style={{
            flex: "none",
            borderRadius: 18,
            border: `1px solid ${theme.colors.yellow[5]}`,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {chip.label}
          <IconX size={14} stroke={2.4} color={theme.colors.brown[1]} aria-hidden />
        </UnstyledButton>
      ))}
    </Group>
  );
}

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
      bg="brown.7"
      mx="auto"
      w="fit-content"
      style={{
        borderRadius: 18,
        border: `1px solid ${theme.colors.brown[4]}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
        whiteSpace: "nowrap",
      }}
    >
      <Text fz={13} c="brown.0">
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
        c="yellow.5"
        bg="brown.5"
        style={{ borderRadius: 14 }}
      >
        Clear
      </UnstyledButton>
    </Group>
  );
}
