"use client";

import { getDirectionsUrl } from "@/app/[spotId]/components/SpotDetail.constants";
import { api } from "@/app/providers";
import { getSpotGearOption, getYesterdayShootDate } from "@/lib/photo-spots";
import type { ShootSpot } from "@/server/routers/shoot";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconCalendarPlus,
  IconCheck,
  IconChevronLeft,
  IconNavigation,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useTodayShoot } from "../useTodayShoot";
import {
  formatDistance,
  formatShootDay,
  formatShotTime,
  getDistanceKm,
  getRouteUrl,
} from "./TodayShoot.constants";

const CARD_BORDER = "1px solid var(--mantine-color-brown-7)";

// The Today's shoot page: the day's spots as a numbered route, ticked off as they're shot.
export function TodayShoot() {
  const shoot = useTodayShoot();
  const { spots } = shoot;
  const upNextIndex = spots.findIndex((spot) => !spot.shotAt);
  const shotCount = spots.filter((spot) => spot.shotAt).length;
  const unshot = spots.filter((spot) => !spot.shotAt);

  return (
    <Container size="30rem" px={0} pb="xxl" w="100%">
      <Group justify="space-between" wrap="nowrap" px="xs" my="sm">
        <ActionIcon
          component={Link}
          href="/"
          aria-label="Back to map"
          variant="subtle"
          color="brown.0"
          size={44}
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <Group gap={6} align="baseline" wrap="nowrap">
          <Title order={1} fz="lg" c="brown.0">
            Today&apos;s shoot
          </Title>
          {shoot.isReady && (
            <Text fz="sm" c="brown.1">
              · {formatShootDay(shoot.date)}
            </Text>
          )}
        </Group>
        <Box w={44} />
      </Group>

      {!shoot.isReady ? (
        <Center mih="50vh">
          <Loader color="yellow" />
        </Center>
      ) : shoot.list.isError ? (
        <Text c="red.5" px="md" role="alert">
          {shoot.list.error.message}
        </Text>
      ) : spots.length === 0 ? (
        <EmptyShoot today={shoot.date} />
      ) : (
        <Stack gap="md" px="md">
          <Group gap="xs">
            <Chip>{spots.length === 1 ? "1 spot" : `${spots.length} spots`}</Chip>
            <Chip>{`${shotCount} shot`}</Chip>
          </Group>

          <Stack component="ol" gap={0} m={0} p={0} style={{ listStyle: "none" }}>
            {spots.map((spot, index) => (
              <ShootStop
                key={spot.spotId}
                spot={spot}
                number={index + 1}
                isUpNext={index === upNextIndex}
                next={spots[index + 1]}
                isSaving={shoot.isSaving}
                onShot={(shot) => shoot.setShot(spot.spotId, shot)}
                onRemove={() => shoot.remove(spot.spotId)}
              />
            ))}
          </Stack>

          {unshot.length > 0 && (
            <Button
              component="a"
              href={getRouteUrl(unshot)}
              target="_blank"
              rel="noreferrer"
              h={52}
              radius="sm"
              autoContrast
              leftSection={<IconNavigation size={18} />}
            >
              {unshot.length === 1
                ? "Directions in Google Maps"
                : "Open whole route in Google Maps"}
            </Button>
          )}
        </Stack>
      )}
    </Container>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <Text
      component="span"
      fz="sm"
      c="brown.0"
      px="sm"
      py={4}
      bg="brown.8"
      style={{ border: CARD_BORDER, borderRadius: 999 }}
    >
      {children}
    </Text>
  );
}

type ShootStopProps = {
  spot: ShootSpot;
  number: number;
  isUpNext: boolean;
  next?: ShootSpot;
  isSaving: boolean;
  onShot: (shot: boolean) => void;
  onRemove: () => void;
};

// One stop on the route: its number (or a tick once shot), its card and the distance to the next.
function ShootStop({ spot, number, isUpNext, next, isSaving, onShot, onRemove }: ShootStopProps) {
  const isShot = Boolean(spot.shotAt);
  const gear = getSpotGearOption(spot.gear);

  return (
    <Box
      component="li"
      style={{ display: "grid", gridTemplateColumns: "36px minmax(0, 1fr)", columnGap: 12 }}
    >
      <Stack gap={0} align="center">
        {isShot ? (
          <UnstyledButton
            aria-label={`Mark ${spot.title} as not shot`}
            onClick={() => onShot(false)}
            disabled={isSaving}
            w={32}
            h={32}
            bdrs="50%"
            bg="yellow.5"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <IconCheck size={16} stroke={3} color="var(--mantine-color-brown-9)" />
          </UnstyledButton>
        ) : (
          <Center
            w={32}
            h={32}
            fz="sm"
            fw={900}
            c={isUpNext ? "yellow.5" : "brown.1"}
            style={{
              borderRadius: "50%",
              border: `2px solid var(--mantine-color-${isUpNext ? "yellow-5" : "brown-6"})`,
            }}
          >
            {number}
          </Center>
        )}
        {next && (
          <Box
            aria-hidden
            w={2}
            mih={20}
            style={{
              flex: 1,
              background: isShot ? "var(--mantine-color-yellow-5)" : "var(--mantine-color-brown-7)",
            }}
          />
        )}
      </Stack>

      <Stack gap={8} pb={next ? 8 : 0}>
        <Paper
          p="sm"
          radius="md"
          bg="brown.8"
          style={{
            border: isUpNext ? "1.5px solid var(--mantine-color-yellow-5)" : CARD_BORDER,
            opacity: isShot ? 0.6 : 1,
          }}
        >
          <Stack gap="sm">
            <Group gap="sm" wrap="nowrap" align="center">
              <UnstyledButton
                component={Link}
                href={`/${spot.spotId}`}
                style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}
              >
                <Box
                  w={64}
                  h={64}
                  bdrs="sm"
                  bg="brown.7"
                  style={{ flexShrink: 0, overflow: "hidden" }}
                >
                  {spot.coverImageUrl ? (
                    <Image src={spot.coverImageUrl} alt="" w={64} h={64} fit="cover" />
                  ) : (
                    <Center h="100%">
                      <IconPhoto size={20} color="var(--mantine-color-brown-1)" />
                    </Center>
                  )}
                </Box>
                <Stack gap={2} miw={0}>
                  {isUpNext && (
                    <Text fz={11} fw={900} c="yellow.5" lts="0.06em">
                      UP NEXT
                    </Text>
                  )}
                  <Text ff="Poppins, sans-serif" fw={600} c="brown.0" lineClamp={2}>
                    {spot.title}
                  </Text>
                  <Text fz="xs" c="brown.1">
                    {spot.shotAt ? `Shot at ${formatShotTime(spot.shotAt)}` : gear.label}
                  </Text>
                </Stack>
              </UnstyledButton>
              <ActionIcon
                variant="subtle"
                color="brown.1"
                size={36}
                aria-label={`Remove ${spot.title} from today's shoot`}
                onClick={onRemove}
                disabled={isSaving}
              >
                <IconX size={18} />
              </ActionIcon>
            </Group>

            {isUpNext && (
              <Group gap="xs" grow>
                <Button
                  component="a"
                  href={getDirectionsUrl(spot.latitude, spot.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  variant="filled"
                  color="#2a241f"
                  c="#f2ece4"
                  style={{ border: "1px solid #4d433b" }}
                  radius="sm"
                  h={40}
                  leftSection={<IconNavigation size={16} color="var(--mantine-color-blue-4)" />}
                >
                  Directions
                </Button>
                <Button
                  radius="sm"
                  h={40}
                  autoContrast
                  leftSection={<IconCheck size={16} stroke={3} />}
                  onClick={() => onShot(true)}
                  loading={isSaving}
                >
                  Mark as shot
                </Button>
              </Group>
            )}
          </Stack>
        </Paper>

        {next && (
          <Text fz="xs" c="brown.1" pl={4}>
            {formatDistance(getDistanceKm(spot, next))} to the next spot
          </Text>
        )}
      </Stack>
    </Box>
  );
}

// Shown when nothing is planned: how to add spots, and yesterday's unshot spots to carry over.
function EmptyShoot({ today }: { today: string }) {
  const utils = api.useUtils();
  const [yesterday] = useState(getYesterdayShootDate);
  const yesterdayList = api.shoot.list.useQuery({ date: yesterday });
  const leftover = (yesterdayList.data ?? []).filter((spot) => !spot.shotAt);
  const moveUnshot = api.shoot.moveUnshot.useMutation({
    onSuccess: () => utils.shoot.list.invalidate(),
  });

  return (
    <Stack gap="xl" px="md" pt="xl">
      <Stack align="center" gap="md" ta="center" px="lg">
        <ThemeIcon size={88} radius={44} color="brown.8" style={{ border: CARD_BORDER }}>
          <IconCalendarPlus size={38} color="var(--mantine-color-yellow-5)" stroke={1.6} />
        </ThemeIcon>
        <Title order={2} fz="xl" c="brown.0">
          Nothing planned for today
        </Title>
        <Text c="brown.1">
          Open a spot and choose{" "}
          <Text component="strong" c="brown.0" fw={700}>
            Add to today&apos;s shoot
          </Text>{" "}
          from its ☰ menu to build your list.
        </Text>
        <Button component={Link} href="/" h={52} radius="sm" autoContrast>
          Browse the map
        </Button>
      </Stack>

      {leftover.length > 0 && (
        <Paper p="md" radius="md" bg="brown.8" style={{ border: CARD_BORDER }}>
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Stack gap={2}>
              <Text fz="xs" c="brown.1">
                {formatShootDay(yesterday)}
              </Text>
              <Text fz="sm" fw={700} c="brown.0">
                {leftover.length === 1
                  ? "1 spot wasn't shot"
                  : `${leftover.length} spots weren't shot`}
              </Text>
            </Stack>
            <Button
              variant="outline"
              color="#4d433b"
              c="#f2ece4"
              radius="sm"
              loading={moveUnshot.isPending}
              onClick={() => moveUnshot.mutate({ fromDate: yesterday, toDate: today })}
            >
              Move to today
            </Button>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}
