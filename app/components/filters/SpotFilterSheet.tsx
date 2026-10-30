"use client";

import { SPOT_GEAR_OPTIONS, type SpotGear } from "@/lib/photo-spots";
import type { SpotSummary } from "@/server/routers/spots";
import {
  Box,
  Button,
  Drawer,
  Group,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconCamera, IconDrone } from "@tabler/icons-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  countActiveFilters,
  EMPTY_SPOT_FILTERS,
  formatWeatherLabel,
  getWeatherEmoji,
  getWeatherFilterOptions,
  matchesSpotFilters,
  STATUS_FILTER_OPTIONS,
  type SpotFilters,
} from "./SpotFilters.constants";

type SpotFilterSheetProps = {
  opened: boolean;
  onClose: () => void;
  filters: SpotFilters;
  onApply: (filters: SpotFilters) => void;
  spots: SpotSummary[];
};

const GEAR_ICONS: Record<SpotGear, typeof IconCamera> = { camera: IconCamera, drone: IconDrone };

// Bottom sheet for filtering the map by weather, status and gear.
// Choices are drafts until "Show N spots" applies them.
export function SpotFilterSheet({ opened, onClose, filters, onApply, spots }: SpotFilterSheetProps) {
  const theme = useMantineTheme();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      title="Filters"
      overlayProps={{ backgroundOpacity: 0.5 }}
      closeButtonProps={{ "aria-label": "Close filters", size: "lg" }}
      styles={{
        content: {
          backgroundColor: theme.colors.brown[7],
          borderTop: `1px solid ${theme.colors.brown[4]}`,
          borderRadius: "20px 20px 0 0",
          maxWidth: "36rem",
          margin: "0 auto",
          height: "auto",
          maxHeight: "90dvh",
          flex: "none",
          width: "100%",
        },
        header: { backgroundColor: theme.colors.brown[7], paddingBottom: 4 },
        title: {
          fontFamily: "var(--mantine-font-family-headings)",
          fontSize: 18,
          fontWeight: 600,
          color: theme.colors.brown[0],
        },
        body: { padding: 0 },
      }}
    >
      {/* Remounted on each open so the drafts start from the applied filters. */}
      {opened && (
        <FilterSheetBody
          initialFilters={filters}
          spots={spots}
          onApply={(next) => {
            onApply(next);
            onClose();
          }}
        />
      )}
    </Drawer>
  );
}

function FilterSheetBody({
  initialFilters,
  spots,
  onApply,
}: {
  initialFilters: SpotFilters;
  spots: SpotSummary[];
  onApply: (filters: SpotFilters) => void;
}) {
  const theme = useMantineTheme();
  const [draft, setDraft] = useState(initialFilters);

  const weatherOptions = useMemo(() => getWeatherFilterOptions(spots), [spots]);
  const matchCount = spots.filter((spot) => matchesSpotFilters(spot, draft)).length;
  const hasFilters = countActiveFilters(draft) > 0;

  function toggleWeather(tag: string) {
    setDraft((current) => ({
      ...current,
      weather: current.weather.includes(tag)
        ? current.weather.filter((value) => value !== tag)
        : [...current.weather, tag],
    }));
  }

  function toggleGear(gear: SpotGear) {
    setDraft((current) => ({
      ...current,
      gear: current.gear.includes(gear)
        ? current.gear.filter((value) => value !== gear)
        : [...current.gear, gear],
    }));
  }

  const idle = {
    backgroundColor: theme.colors.brown[5],
    border: `1px solid ${theme.colors.brown[4]}`,
    color: theme.colors.brown[0],
  };
  const active = {
    backgroundColor: theme.colors.yellow[5],
    border: `1px solid ${theme.colors.yellow[5]}`,
    color: theme.colors.brown[9],
    fontWeight: 900,
  };

  return (
    <>
      <Stack gap="lg" px="lg" pt="xs" pb="md">
        <FilterSection label="Weather">
          <Group gap={8}>
            {weatherOptions.map((tag) => {
              const isOn = draft.weather.includes(tag);
              const emoji = getWeatherEmoji(tag);
              return (
                <UnstyledButton
                  key={tag}
                  aria-pressed={isOn}
                  onClick={() => toggleWeather(tag)}
                  h={40}
                  px={14}
                  fz="sm"
                  fw={700}
                  style={{
                    ...(isOn ? active : idle),
                    borderRadius: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {emoji && <span aria-hidden>{emoji}</span>}
                  {formatWeatherLabel(tag)}
                </UnstyledButton>
              );
            })}
          </Group>
        </FilterSection>

        <FilterSection label="Status">
          <SimpleGrid
            cols={3}
            spacing={4}
            p={4}
            style={{
              borderRadius: 10,
              backgroundColor: theme.colors.brown[5],
              border: `1px solid ${theme.colors.brown[4]}`,
            }}
          >
            {STATUS_FILTER_OPTIONS.map((option) => {
              const value = option.value === "any" ? null : option.value;
              const isOn = draft.status === value;
              return (
                <UnstyledButton
                  key={option.value}
                  aria-pressed={isOn}
                  onClick={() => setDraft((current) => ({ ...current, status: value }))}
                  h={40}
                  fz="sm"
                  fw={isOn ? 900 : 700}
                  ta="center"
                  style={{
                    borderRadius: 7,
                    backgroundColor: isOn ? theme.colors.yellow[5] : "transparent",
                    color: isOn
                      ? theme.colors.brown[9]
                      : value
                        ? theme.colors.brown[0]
                        : theme.colors.brown[1],
                  }}
                >
                  {option.label}
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </FilterSection>

        <FilterSection label="Gear">
          <SimpleGrid cols={2} spacing={8}>
            {SPOT_GEAR_OPTIONS.map((option) => {
              const isOn = draft.gear.includes(option.value);
              const Icon = GEAR_ICONS[option.value];
              return (
                <UnstyledButton
                  key={option.value}
                  aria-pressed={isOn}
                  onClick={() => toggleGear(option.value)}
                  h={56}
                  fz="md"
                  fw={700}
                  c="brown.0"
                  bg="brown.5"
                  style={{
                    borderRadius: 10,
                    border: isOn
                      ? `1.5px solid ${theme.colors.yellow[5]}`
                      : `1px solid ${theme.colors.brown[4]}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Icon
                    size={20}
                    color={isOn ? theme.colors.yellow[5] : theme.colors.brown[1]}
                    aria-hidden
                  />
                  {option.label}
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </FilterSection>
      </Stack>

      <Group
        gap={10}
        wrap="nowrap"
        px="lg"
        pt="md"
        pb="lg"
        style={{ borderTop: `1px solid ${theme.colors.brown[5]}` }}
      >
        <Button
          variant="outline"
          color={theme.colors.brown[3]}
          c="brown.0"
          size="lg"
          radius="sm"
          fz="md"
          disabled={!hasFilters}
          style={{ backgroundColor: "transparent", opacity: hasFilters ? 1 : 0.4 }}
          onClick={() => setDraft(EMPTY_SPOT_FILTERS)}
        >
          Clear all
        </Button>
        <Button
          flex={1}
          size="lg"
          radius="sm"
          fz="md"
          fw={900}
          autoContrast
          disabled={matchCount === 0}
          onClick={() => onApply(draft)}
        >
          {matchCount === 0
            ? "No spots match"
            : `Show ${matchCount} ${matchCount === 1 ? "spot" : "spots"}`}
        </Button>
      </Group>
    </>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box component="fieldset" m={0} p={0} style={{ border: 0 }}>
      <Text component="legend" fz={12} fw={900} c="brown.1" pb={10} style={{ letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </Box>
  );
}
