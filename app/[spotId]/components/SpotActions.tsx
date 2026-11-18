"use client";

import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotDetail } from "@/server/routers/spots";
import { ActionIcon, Button, Group, Menu, Paper, Text, useMantineTheme } from "@mantine/core";
import {
  IconCalendarMinus,
  IconCalendarPlus,
  IconArrowsMove,
  IconDots,
  IconListNumbers,
  IconNavigation,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTodayShoot } from "@/app/today/useTodayShoot";
import { useUpNext } from "@/app/up-next/useUpNext";
import { DeleteSpotModal } from "./DeleteSpotButton";
import { EditSpotModal } from "./EditSpotButton";
import { getDirectionsUrl } from "./SpotDetail.constants";

type SpotActionsProps = {
  spot: SpotDetail;
};

// The spot's menu, behind the ⋯ button in the header: today's shoot, Up next, directions, edit,
// move and delete. The content tabs are the chips under the spot name.
export function SpotActions({ spot }: SpotActionsProps) {
  const theme = useMantineTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const shoot = useTodayShoot();
  const isInShoot = shoot.has(spot.id);
  const upNext = useUpNext();
  const isUpNext = upNext.has(spot.id);
  // A message after adding or removing the spot, with a link to the list it changed.
  const [toast, setToast] = useState<{ message: string; href: string } | null>(null);

  // The "added" message hides itself after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function toggleShoot() {
    try {
      if (isInShoot) {
        await shoot.remove(spot.id);
        setToast({ message: "Removed from today's shoot", href: "/today" });
      } else {
        await shoot.add(spot.id);
        const count = shoot.spots.length + 1;
        setToast({
          message: `Added to today's shoot · ${count} ${count === 1 ? "spot" : "spots"}`,
          href: "/today",
        });
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Couldn't update today's shoot",
        href: "/today",
      });
    }
  }

  async function toggleUpNext() {
    try {
      if (isUpNext) {
        await upNext.remove(spot.id);
        setToast({ message: "Removed from Up next", href: "/up-next" });
      } else {
        await upNext.add(spot.id);
        const count = upNext.spots.length + 1;
        setToast({
          message: `Added to Up next · ${count} ${count === 1 ? "spot" : "spots"}`,
          href: "/up-next",
        });
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Couldn't update Up next",
        href: "/up-next",
      });
    }
  }

  return (
    <>
      <Menu
        position="bottom-end"
        width={260}
        radius="md"
        shadow="md"
        // Bigger text, icons and tap targets than Mantine's compact default.
        styles={{
          item: { fontSize: 16, padding: "12px 14px", minHeight: 48 },
          itemSection: { marginInlineEnd: 12 },
        }}
      >
        <Menu.Target>
          <ActionIcon aria-label="Spot options" variant="subtle" color="teal.0" size={44}>
            <IconDots size={22} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {CAN_EDIT_SPOTS && shoot.isReady && (
            <Menu.Item
              leftSection={
                isInShoot ? (
                  <IconCalendarMinus size={20} />
                ) : (
                  <IconCalendarPlus size={20} color="var(--mantine-color-amber-5)" />
                )
              }
              onClick={toggleShoot}
            >
              {isInShoot ? "Remove from today's shoot" : "Add to today's shoot"}
            </Menu.Item>
          )}
          {CAN_EDIT_SPOTS && upNext.list.isSuccess && (
            <Menu.Item
              leftSection={
                <IconListNumbers
                  size={20}
                  color={isUpNext ? undefined : "var(--mantine-color-amber-5)"}
                />
              }
              onClick={toggleUpNext}
            >
              {isUpNext ? "Remove from Up next" : "Add to Up next"}
            </Menu.Item>
          )}
          <Menu.Item
            component="a"
            href={getDirectionsUrl(spot.latitude, spot.longitude)}
            target="_blank"
            rel="noreferrer"
            leftSection={<IconNavigation size={20} color={theme.other!.colors.teal} />}
          >
            Directions
          </Menu.Item>
          {CAN_EDIT_SPOTS && (
            <>
              <Menu.Item leftSection={<IconPencil size={20} />} onClick={() => setIsEditing(true)}>
                Edit spot
              </Menu.Item>
              <Menu.Item
                component={Link}
                href={`/?move=${spot.id}`}
                leftSection={<IconArrowsMove size={20} />}
              >
                Move pin
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={20} />}
                onClick={() => setIsConfirmingDelete(true)}
              >
                Delete spot
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      {toast && (
        <Paper
          role="status"
          pos="fixed"
          bottom="var(--mantine-spacing-lg)"
          left="var(--mantine-spacing-md)"
          right="var(--mantine-spacing-md)"
          maw="28rem"
          mx="auto"
          p="xs"
          pl="md"
          radius="md"
          bg="teal.0"
          shadow="lg"
          style={{ zIndex: 300 }}
        >
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Text fz="sm" fw={700} c="teal.9">
              {toast.message}
            </Text>
            <Button component={Link} href={toast.href} radius="sm" autoContrast size="sm">
              View
            </Button>
          </Group>
        </Paper>
      )}

      {CAN_EDIT_SPOTS && (
        <>
          <EditSpotModal spot={spot} opened={isEditing} onClose={() => setIsEditing(false)} />
          <DeleteSpotModal
            spotId={spot.id}
            title={spot.title}
            photoCount={spot.photos.length}
            opened={isConfirmingDelete}
            onClose={() => setIsConfirmingDelete(false)}
          />
        </>
      )}
    </>
  );
}
