"use client";

import { UnstyledButton, useMantineTheme } from "@mantine/core";

type ClusterMarkerProps = {
  count: number;
  onSelect: () => void;
};

export function ClusterMarker({ count, onSelect }: ClusterMarkerProps) {
  const theme = useMantineTheme();
  // Bigger groups get a slightly bigger bubble, capped so it never swamps the map.
  const size = Math.min(44 + Math.log2(count) * 6, 72);

  return (
    <UnstyledButton
      aria-label={`${count} spots here, zoom in`}
      onClick={onSelect}
      w={size}
      h={size}
      bdrs="50%"
      bg="brown.7"
      c="brown.0"
      ff="monospace"
      fw={700}
      fz={count >= 10 ? "lg" : "md"}
      ta="center"
      style={{
        border: `2px solid ${theme.colors.yellow[5]}`,
        boxShadow: `0 0 0 6px color-mix(in srgb, ${theme.colors.yellow[5]} 16%, transparent)`,
      }}
    >
      {count}
    </UnstyledButton>
  );
}
