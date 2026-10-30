"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotCarousel, SpotDetail } from "@/server/routers/spots";
import {
  ActionIcon,
  Button,
  Collapse,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import { SpotPhotoTab } from "./SpotPhotoTab";

type ShowcaseCarouselSectionProps = {
  spot: SpotDetail;
  carousel: SpotCarousel;
  labels?: ReactNode;
  canDelete: boolean;
};

// One named carousel on the Showcase tab: its title and menu, then its photos and notes.
// Tapping the title collapses or expands the photos.
export function ShowcaseCarouselSection({
  spot,
  carousel,
  labels,
  canDelete,
}: ShowcaseCarouselSectionProps) {
  const utils = api.useUtils();
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const refresh = () =>
    Promise.all([utils.spots.byId.invalidate({ id: spot.id }), utils.spots.list.invalidate()]);
  const rename = api.carousels.rename.useMutation({
    onSuccess: async () => {
      await refresh();
      setTitleDraft(null);
    },
  });
  const deleteCarousel = api.carousels.delete.useMutation({
    onSuccess: async () => {
      await refresh();
      setIsConfirmingDelete(false);
    },
  });

  // A placeholder carousel (no id) can't be renamed or deleted until it has been saved.
  const carouselId = carousel.id;
  const photoCount = carousel.photos.length;

  function saveTitle() {
    if (!carouselId || titleDraft === null) return;
    const title = titleDraft.trim();
    if (!title || title === carousel.title) return setTitleDraft(null);
    rename.mutate({ id: carouselId, title });
  }

  return (
    <Stack gap="xs" component="section" aria-label={carousel.title}>
      <Group justify="space-between" wrap="nowrap" px="md" mih={36}>
        {titleDraft !== null ? (
          <TextInput
            aria-label="Carousel name"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.currentTarget.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveTitle();
              if (event.key === "Escape") setTitleDraft(null);
            }}
            error={rename.error?.message}
            maxLength={80}
            flex={1}
            autoFocus
          />
        ) : (
          <UnstyledButton
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${carousel.title}`}
            display="flex"
            miw={0}
            mih={36}
            style={{ alignItems: "center", gap: "var(--mantine-spacing-xs)", flex: 1 }}
          >
            <IconChevronDown
              size={18}
              color="var(--mantine-color-brown-1)"
              style={{
                flexShrink: 0,
                transform: isExpanded ? undefined : "rotate(-90deg)",
                transition: "transform 150ms ease",
              }}
            />
            <Title order={2} fz="md" c="brown.0" lineClamp={1}>
              {carousel.title}
            </Title>
            <Text ff="monospace" fz="xs" c="brown.1" style={{ flexShrink: 0 }}>
              · {photoCount}
            </Text>
          </UnstyledButton>
        )}

        {CAN_EDIT_SPOTS && carouselId && titleDraft === null && (
          <Menu position="bottom-end" width={180} radius="md">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="brown.1"
                aria-label={`Options for ${carousel.title}`}
              >
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPencil size={16} />}
                onClick={() => setTitleDraft(carousel.title)}
              >
                Rename
              </Menu.Item>
              {canDelete && (
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  Delete carousel
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      <Collapse expanded={isExpanded}>
        <SpotPhotoTab
          spot={spot}
          photos={carousel.photos}
          kind="showcase"
          carouselId={carouselId}
          labels={labels}
        />
      </Collapse>

      <Modal
        opened={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        title="Delete this carousel?"
        centered
      >
        <Stack gap="md">
          <Text fz="sm">
            <strong>{carousel.title}</strong>
            {photoCount > 0 &&
              ` and its ${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}{" "}
            will be removed. This can&apos;t be undone.
          </Text>
          {deleteCarousel.error && (
            <Text fz="sm" c="red.5" role="alert">
              {deleteCarousel.error.message}
            </Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteCarousel.isPending}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteCarousel.isPending}
              onClick={() => carouselId && deleteCarousel.mutate({ id: carouselId })}
            >
              Delete carousel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
