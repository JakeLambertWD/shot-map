"use client";

import { Box, Tabs, useMantineTheme } from "@mantine/core";
import { useEffect, useRef } from "react";

export type TabChip<Id extends string> = {
  id: Id;
  label: string;
  // Shown as a badge on the chip when above zero.
  count?: number;
};

type TabChipsProps<Id extends string> = {
  tabs: readonly TabChip<Id>[];
  value: Id;
  ariaLabel: string;
};

// Tabs as a row of chips. Rendered inside a <Tabs> (the "pills" variant, so there's no
// underline), so they switch the panel below and get arrow-key navigation. The row scrolls
// sideways.
export function TabChips<Id extends string>({ tabs, value, ariaLabel }: TabChipsProps<Id>) {
  const theme = useMantineTheme();
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected chip in view, e.g. after picking one near the end of the row.
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [value]);

  return (
    <Box pos="relative" pb="sm">
      <Tabs.List
        ref={listRef}
        aria-label={ariaLabel}
        px="md"
        style={{
          gap: 8,
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollbarWidth: "none",
          // Fades the last visible chip, hinting there are more to swipe to.
          maskImage: "linear-gradient(to right, black calc(100% - 40px), transparent)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === value;
          const count = tab.count ?? 0;
          return (
            <Tabs.Tab
              key={tab.id}
              value={tab.id}
              rightSection={
                count > 0 ? (
                  <Box
                    component="span"
                    miw={18}
                    h={18}
                    px={5}
                    fz={11}
                    fw={900}
                    style={{
                      borderRadius: 9,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive ? "rgba(0, 0, 0, 0.18)" : theme.colors.teal[4],
                    }}
                  >
                    {count}
                  </Box>
                ) : null
              }
              styles={{
                tab: {
                  flex: "none",
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 18,
                  border: isActive ? "none" : `1px solid ${theme.colors.teal[4]}`,
                  backgroundColor: isActive ? theme.colors.amber[5] : theme.colors.teal[6],
                  color: isActive ? theme.colors.teal[9] : theme.colors.teal[0],
                  fontSize: 13,
                  fontWeight: isActive ? 900 : 700,
                  whiteSpace: "nowrap",
                },
                tabSection: { marginInlineStart: 6 },
              }}
            >
              {tab.label}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Box>
  );
}
