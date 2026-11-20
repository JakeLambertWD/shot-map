"use client";

import { CAN_EDIT_SPOTS, type UpNextContent } from "@/lib/photo-spots";
import type { SpotDetail } from "@/server/routers/spots";
import { ActionIcon, Button, Group, Menu, Paper, Text, useMantineTheme } from "@mantine/core";
import {
  IconArrowsMove,
  IconDots,
  IconListNumbers,
  IconNavigation,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UpNextContentModal } from "@/app/up-next/components/UpNextContentModal";
import { useUpNext } from "@/app/up-next/useUpNext";
import { DeleteSpotModal } from "./DeleteSpotButton";
import { EditSpotModal } from "./EditSpotButton";
import { getDirectionsUrl } from "./SpotDetail.constants";

type SpotActionsProps = {
  spot: SpotDetail;
};

// The spot's menu, behind the ⋯ button in the header: Up next, directions, edit,
// move and delete. The content tabs are the chips under the spot name.
export function SpotActions({ spot }: SpotActionsProps) {
  const theme = useMantineTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isChoosingUpNextContent, setIsChoosingUpNextContent] = useState(false);
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

  // Adding asks what the spot is being shot for first; removing happens straight away.
  async function toggleUpNext() {
    if (!isUpNext) {
      setIsChoosingUpNextContent(true);
      return;
    }
    try {
      await upNext.remove(spot.id);
      setToast({ message: "Removed from Up next", href: "/up-next" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Couldn't update Up next",
        href: "/up-next",
      });
    }
  }

  // Errors stay in the modal, which shows them under the options.
  async function addToUpNext(content: UpNextContent) {
    await upNext.add(spot.id, content);
    setIsChoosingUpNextContent(false);
    const count = upNext.spots.length + 1;
    setToast({
      message: `Added to Up next · ${count} ${count === 1 ? "spot" : "spots"}`,
      href: "/up-next",
    });
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
          <UpNextContentModal
            opened={isChoosingUpNextContent}
            onClose={() => setIsChoosingUpNextContent(false)}
            spotTitle={spot.title}
            onPick={addToUpNext}
          />
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
