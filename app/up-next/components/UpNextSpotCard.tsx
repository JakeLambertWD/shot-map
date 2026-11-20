"use client";

import { getSpotTabHref } from "@/app/[spotId]/components/SpotContentTabs.constants";
import { REEL_CARD_BORDER } from "@/app/[spotId]/components/reels/Reels.constants";
import { formatSpotLocation } from "@/app/components/sortable-spots/SortableSpots.constants";
import {
  UPCOMING_POST_NUMBER_GUTTER,
  UpcomingPostNumber,
  type UpcomingPostDragHandle,
} from "@/app/upcoming/components/UpcomingPostNumber";
import { CAN_EDIT_SPOTS, type UpNextContent } from "@/lib/photo-spots";
import type { UpNextSpot } from "@/server/routers/upNext";
import { ActionIcon, Center, Group, Image, Menu, Paper, Stack, Text } from "@mantine/core";
import { IconDots, IconPhoto, IconTrash } from "@tabler/icons-react";
import Link from "next/link";
import { getSpotChips } from "./UpNext.constants";
import { UpNextContentMenu } from "./UpNextContentMenu";
import classes from "./UpNextSpots.module.css";

const PHOTO_WIDTH = 88;
const PHOTO_HEIGHT = 110;

type UpNextSpotCardProps = {
  spot: UpNextSpot;
  // Its place in the list.
  number: number;
  // Given, the number is a handle for dragging the spot into a new place.
  dragHandle?: UpcomingPostDragHandle;
  onContentChange: (content: UpNextContent) => void;
  onRemove: () => void;
  isRemoving: boolean;
};

// An Up next spot as a card, like a post on the Posts page: its cover photo, then its name,
// postcode, what it's being shot for and the conditions it suits. Tapping the card opens the spot.
export function UpNextSpotCard({
  spot,
  number,
  dragHandle,
  onContentChange,
  onRemove,
  isRemoving,
}: UpNextSpotCardProps) {
  return (
    <Paper
      pos="relative"
      bg="teal.6"
      radius="md"
      p="sm"
      className={classes.row}
      style={{ border: REEL_CARD_BORDER }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {spot.coverImageUrl ? (
          <Image
            src={spot.coverImageUrl}
            alt=""
            w={PHOTO_WIDTH}
            h={PHOTO_HEIGHT}
            radius={6}
            fit="cover"
            style={{ flex: "none" }}
          />
        ) : (
          <Center
            w={PHOTO_WIDTH}
            h={PHOTO_HEIGHT}
            bg="teal.5"
            aria-hidden
            style={{ borderRadius: 6, flex: "none" }}
          >
            <IconPhoto size={24} color="var(--mantine-color-teal-2)" />
          </Center>
        )}

        {/* The gutter less the card's own padding keeps the text clear of the menu and number. */}
        <Stack
          gap={4}
          flex={1}
          miw={0}
          pr={`calc(${UPCOMING_POST_NUMBER_GUTTER}px - var(--mantine-spacing-sm))`}
        >
          <Text
            renderRoot={(props) => (
              <Link href={getSpotTabHref(spot.id, "showcase", "up-next")} {...props} />
            )}
            className={classes.titleLink}
            ff="heading"
            fz={15}
            fw={600}
            lh={1.3}
            c="teal.0"
            td="none"
            lineClamp={2}
          >
            {spot.title}
          </Text>
          <Text fz="xs" c="teal.1" truncate>
            {formatSpotLocation(spot)}
          </Text>
          <Group gap={6} mt={4}>
            <UpNextContentMenu
              className={classes.raised}
              spotTitle={spot.title}
              content={spot.content}
              onChange={onContentChange}
            />
            {getSpotChips(spot).map(({ label, icon: Icon }) => (
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
        </Stack>
      </Group>

      {CAN_EDIT_SPOTS && (
        <Menu position="bottom-end" width={220} radius="md" shadow="md">
          <Menu.Target>
            <ActionIcon
              aria-label={`More for ${spot.title}`}
              variant="subtle"
              color="teal.1"
              size={40}
              pos="absolute"
              top={4}
              right={4}
              loading={isRemoving}
            >
              <IconDots size={20} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              mih={44}
              leftSection={<IconTrash size={16} />}
              onClick={onRemove}
            >
              Remove from Up next
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}

      <UpcomingPostNumber
        postId={spot.id}
        number={number}
        dragHandle={dragHandle}
        itemName="Spot"
      />
    </Paper>
  );
}
