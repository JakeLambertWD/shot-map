"use client";

import { getSpotTabHref } from "@/app/[spotId]/components/SpotContentTabs.constants";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import { SortableSpotList } from "@/app/components/sortable-spots/SortableSpotList";
import { SpotThumbnail } from "@/app/components/sortable-spots/SpotThumbnail";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Menu,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconDots,
  IconListNumbers,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useUpNext } from "../useUpNext";
import { AddUpNextSpotsModal } from "./AddUpNextSpotsModal";
import { getSpotChips, isInUpNextTab, UP_NEXT_TABS, type UpNextTab } from "./UpNext.constants";
import { UpNextContentMenu } from "./UpNextContentMenu";
import classes from "./UpNextSpots.module.css";

const CARD_BACKGROUND = "var(--mantine-color-teal-6)";
const CARD_BORDER = "1px solid var(--mantine-color-teal-4)";

// The Up next page: spots to shoot in the near future, in a card. Spots are added from here or
// from a spot's menu, join the bottom of the list, and can be dragged into the order they'll be
// shot. The tabs narrow the list to spots shot for a carousel or a reel.
export function UpNextSpots() {
  const upNext = useUpNext();
  const { isPending, isError, error } = upNext.list;
  const { spots } = upNext;
  const [tab, setTab] = useState<UpNextTab>("all");
  const [isAdding, setIsAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const shownSpots = spots.filter((spot) => isInUpNextTab(spot.content, tab));

  async function remove(spotId: string) {
    setRemoveError(null);
    try {
      await upNext.remove(spotId);
    } catch (removeFailure) {
      setRemoveError(
        removeFailure instanceof Error ? removeFailure.message : "Couldn't remove that spot.",
      );
    }
  }

  return (
    <Container size="30rem" px="md" py="sm" pb="xxl" w="100%">
      <ActionIcon
        component={Link}
        href="/"
        aria-label="Back to map"
        variant="subtle"
        color="teal.0"
        size={44}
        ml={-10}
        mb="xs"
      >
        <IconChevronLeft size={24} />
      </ActionIcon>

      <Box bg={CARD_BACKGROUND} bdrs="xxl" style={{ border: CARD_BORDER, overflow: "hidden" }}>
        <Stack gap="md" p="lg" pb="md" style={{ borderBottom: CARD_BORDER }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2} miw={0}>
              <Title order={1} fz={28} lh={1.2} fw={800} c="teal.0">
                Up next
              </Title>
              <Text fz="sm" c="teal.1">
                {spots.length} {spots.length === 1 ? "spot" : "spots"} to shoot
              </Text>
            </Stack>
            {CAN_EDIT_SPOTS && (
              <Button
                size="md"
                radius="md"
                leftSection={<IconPlus size={18} />}
                onClick={() => setIsAdding(true)}
                autoContrast
                style={{ flexShrink: 0 }}
              >
                Add spot
              </Button>
            )}
          </Group>

          <SegmentedControl
            fullWidth
            size="md"
            radius="md"
            aria-label="Show spots for"
            data={[...UP_NEXT_TABS]}
            value={tab}
            onChange={(value) => setTab(value as UpNextTab)}
            color="teal.4"
            bg="teal.7"
            styles={{ label: { fontWeight: 700 } }}
          />
        </Stack>

        {removeError && (
          <Text fz="sm" c="red.5" px="lg" pt="sm" role="alert">
            {removeError}
          </Text>
        )}

        {isPending ? (
          <Center mih={240}>
            <Loader color="amber" />
          </Center>
        ) : isError ? (
          <Text c="red.5" p="lg" role="alert">
            {error.message}
          </Text>
        ) : spots.length === 0 ? (
          <Stack mih={280} align="center" justify="center" gap="sm" px="xl" ta="center">
            <IconListNumbers size={40} stroke={1.5} color="var(--mantine-color-teal-2)" />
            <Text fw={700} c="teal.0">
              Nothing up next yet
            </Text>
            <Text fz="sm" c="teal.1">
              Add the spots you want to shoot soon, then drag them into order.
            </Text>
          </Stack>
        ) : shownSpots.length === 0 ? (
          <Center mih={200} px="xl" ta="center" fz="sm" c="teal.1">
            No spots up next for a {tab} yet
          </Center>
        ) : (
          <Box pb="xl">
            <SortableSpotList
              spots={shownSpots}
              // Only the full list can be reordered, so a filtered list never saves a partial order.
              canReorder={CAN_EDIT_SPOTS && tab === "all"}
              onReorder={upNext.saveOrder}
              handleSide="start"
              rowBackground={CARD_BACKGROUND}
              renderSpot={(spot) => {
                const chips = getSpotChips(spot);
                return (
                  <>
                    <Group wrap="nowrap" gap="md" py="md" flex={1} miw={0} className={classes.row}>
                      <SpotThumbnail coverImageUrl={spot.coverImageUrl} />
                      <Stack gap={2} flex={1} miw={0}>
                        <Text
                          renderRoot={(props) => (
                            <Link
                              href={getSpotTabHref(spot.id, "showcase", "up-next")}
                              {...props}
                            />
                          )}
                          className={classes.titleLink}
                          fw={700}
                          c="teal.0"
                          td="none"
                          truncate
                        >
                          {spot.title}
                        </Text>
                        <Text fz="xs" c="teal.1" truncate>
                          {formatSpotLocation(spot)}
                        </Text>
                        {chips.length > 0 && (
                          <Group gap={6} mt={6}>
                            {chips.map(({ label, icon: Icon }) => (
                              <Group
                                key={label}
                                gap={4}
                                wrap="nowrap"
                                h={24}
                                px={8}
                                bdrs="sm"
                                bg="teal.4"
                                fz="xs"
                                fw={700}
                                c="teal.0"
                              >
                                {Icon && <Icon size={13} stroke={1.75} aria-hidden />}
                                {label}
                              </Group>
                            ))}
                          </Group>
                        )}
                      </Stack>
                    </Group>
                    <UpNextContentMenu
                      spotTitle={spot.title}
                      content={spot.content}
                      onChange={(content) => upNext.saveContent(spot.id, content)}
                    />
                    {CAN_EDIT_SPOTS && (
                      <Menu position="bottom-end" width={220} radius="md" shadow="md">
                        <Menu.Target>
                          <ActionIcon
                            aria-label={`More for ${spot.title}`}
                            variant="subtle"
                            color="teal.1"
                            size={44}
                            loading={upNext.removingSpotId === spot.id}
                            style={{ flexShrink: 0 }}
                          >
                            <IconDots size={20} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            color="red"
                            mih={44}
                            leftSection={<IconTrash size={16} />}
                            onClick={() => remove(spot.id)}
                          >
                            Remove from Up next
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </>
                );
              }}
            />
          </Box>
        )}
      </Box>

      {CAN_EDIT_SPOTS && (
        <AddUpNextSpotsModal
          opened={isAdding}
          onClose={() => setIsAdding(false)}
          upNextSpotIds={spots.map((spot) => spot.id)}
          onAdd={upNext.add}
          addingSpotId={upNext.addingSpotId}
        />
      )}
    </Container>
  );
}
