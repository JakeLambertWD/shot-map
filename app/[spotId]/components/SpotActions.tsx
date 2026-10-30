"use client";

import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotDetail } from "@/server/routers/spots";
import { ActionIcon, Button, Group, Menu, Paper, Text } from "@mantine/core";
import {
  IconCalendarMinus,
  IconCalendarPlus,
  IconArrowsMove,
  IconDots,
  IconNavigation,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTodayShoot } from "@/app/today/useTodayShoot";
import { DeleteSpotModal } from "./DeleteSpotButton";
import { EditSpotModal } from "./EditSpotButton";
import { getDirectionsUrl } from "./SpotDetail.constants";

type SpotActionsProps = {
  spot: SpotDetail;
};

// The spot's menu, behind the ⋯ button in the header: today's shoot, directions, edit, move
// and delete. The content tabs are the chips under the spot name.
export function SpotActions({ spot }: SpotActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const shoot = useTodayShoot();
  const isInShoot = shoot.has(spot.id);
  const [toast, setToast] = useState<string | null>(null);

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
        setToast("Removed from today's shoot");
      } else {
        await shoot.add(spot.id);
        const count = shoot.spots.length + 1;
        setToast(`Added to today's shoot · ${count} ${count === 1 ? "spot" : "spots"}`);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Couldn't update today's shoot");
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
          <ActionIcon aria-label="Spot options" variant="subtle" color="brown.0" size={44}>
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
                  <IconCalendarPlus size={20} color="var(--mantine-color-yellow-5)" />
                )
              }
              onClick={toggleShoot}
            >
              {isInShoot ? "Remove from today's shoot" : "Add to today's shoot"}
            </Menu.Item>
          )}
          <Menu.Item
            component="a"
            href={getDirectionsUrl(spot.latitude, spot.longitude)}
            target="_blank"
            rel="noreferrer"
            leftSection={<IconNavigation size={20} color="var(--mantine-color-blue-4)" />}
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
          bg="brown.0"
          shadow="lg"
          style={{ zIndex: 300 }}
        >
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Text fz="sm" fw={700} c="brown.9">
              {toast}
            </Text>
            <Button component={Link} href="/today" radius="sm" autoContrast size="sm">
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
