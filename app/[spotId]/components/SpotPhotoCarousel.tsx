"use client";

import type { SpotStatus } from "@/lib/photo-spots";
import type { SpotDetail } from "@/server/routers/spots";
import {
  ActionIcon,
  AspectRatio,
  Box,
  Button,
  Drawer,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconLayoutGrid, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type UIEvent } from "react";
import { formatSpotTag, SPOT_TAG_EMOJIS } from "@/app/components/add-spot/AddSpot.constants";
import { PhotoDots } from "./PhotoDots";
import { PhotoThumbnails } from "./PhotoThumbnails";
import { SpotStatusIcon } from "./SpotStatusIcon";
import styles from "./SpotPhotoCarousel.module.css";

type SpotPhotoCarouselProps = {
  photos: SpotDetail["photos"];
  tags: string[];
  // Shown at the start of the tag row, e.g. the spot's status badge.
  tagsLeading?: ReactNode;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  // Shown at the end of the all-photos grid, e.g. an "add photos" button.
  extraThumbnail?: ReactNode;
  // Given, the thumbnails can be dragged into a new order.
  onReorder?: (photoIds: string[], movedPhotoId: string) => void;
  // Given, the spot's status shows as an icon in the bottom-left corner of each photo.
  status?: SpotStatus;
  // Given, an "Add" button sits next to the photo count (e.g. to pick from the creator library).
  onAdd?: () => void;
  // Given, each photo gets a remove button in its bottom-right corner.
  onRemove?: (photo: SpotDetail["photos"][number]) => void;
};

export function SpotPhotoCarousel({
  photos,
  tags,
  tagsLeading,
  activeIndex,
  onActiveIndexChange,
  extraThumbnail,
  onReorder,
  status,
  onAdd,
  onRemove,
}: SpotPhotoCarouselProps) {
  const theme = useMantineTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);

  // Start the full screen track on the photo that was tapped, without animating.
  const activeIndexRef = useRef(activeIndex);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  const placeViewerTrack = useCallback((track: HTMLDivElement | null) => {
    if (track) track.scrollLeft = activeIndexRef.current * track.clientWidth;
  }, []);

  function handleViewerScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) onActiveIndexChange(index);
  }

  // Keep the slide in view when the active photo changes from outside (e.g. after adding photos).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || Math.round(track.scrollLeft / track.clientWidth) === activeIndex) return;
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior: "smooth" });
  }, [activeIndex]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;

    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) onActiveIndexChange(index);
  }

  // Gear and weather emojis.
  const hasLabels = tags.length > 0 || Boolean(tagsLeading);
  const labels = hasLabels && (
    <>
      {tagsLeading}
      {tags.map((tag) => (
        <span key={tag} role="img" aria-label={formatSpotTag(tag)} title={formatSpotTag(tag)}>
          {SPOT_TAG_EMOJIS[tag] ?? formatSpotTag(tag)}
        </span>
      ))}
    </>
  );
  const hasPhotoControls = photos.length > 1 || Boolean(extraThumbnail) || Boolean(onAdd);

  function goToPhoto(index: number) {
    const track = trackRef.current;
    track?.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    onActiveIndexChange(index);
  }

  return (
    <Box>
      <Box pos="relative">
        <div
          ref={trackRef}
          className={styles.track}
          onScroll={handleScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Spot photos"
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={styles.slide}
              aria-roledescription="slide"
              aria-label={`Photo ${index + 1} of ${photos.length}`}
            >
              <Box pos="relative">
                <UnstyledButton
                  w="100%"
                  display="block"
                  pos="relative"
                  aria-label={`View photo ${index + 1} full screen`}
                  onClick={() => setIsFullScreen(true)}
                >
                  {/* A fixed 4:5 frame, so the page doesn't jump between photos. The whole photo
                    fits inside it: landscape shots get space above and below, not cropped sides. */}
                  <AspectRatio ratio={4 / 5}>
                    <Image src={photo.imageUrl} alt={photo.caption ?? ""} fit="contain" />
                  </AspectRatio>
                  {photos.length > 1 && (
                    <Text
                      aria-hidden
                      component="span"
                      pos="absolute"
                      top={10}
                      right={10}
                      h={26}
                      px={10}
                      fz={13}
                      fw={700}
                      c="brown.0"
                      style={{
                        borderRadius: 13,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {index + 1} / {photos.length}
                    </Text>
                  )}
                  {status && (
                    <Box pos="absolute" bottom={10} left={10}>
                      <SpotStatusIcon status={status} withTooltip={false} />
                    </Box>
                  )}
                </UnstyledButton>
                {/* A sibling of the photo button (not inside it), so it's a separate tap target. */}
                {onRemove && (
                  <ActionIcon
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => onRemove(photo)}
                    pos="absolute"
                    bottom={10}
                    right={10}
                    size={36}
                    radius="xl"
                    variant="filled"
                    color="rgba(0, 0, 0, 0.6)"
                    style={{ border: `1.5px solid ${theme.colors.brown[1]}` }}
                  >
                    <IconTrash size={17} color={theme.colors.brown[0]} />
                  </ActionIcon>
                )}
              </Box>
            </div>
          ))}
        </div>
      </Box>

      <Modal
        opened={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        fullScreen
        padding={0}
        withCloseButton={false}
        transitionProps={{ transition: "fade", duration: 150 }}
        styles={{ content: { background: "black" }, body: { height: "100%" } }}
      >
        <ActionIcon
          variant="transparent"
          c="white"
          size={44}
          pos="absolute"
          top="var(--mantine-spacing-sm)"
          right="var(--mantine-spacing-sm)"
          style={{ zIndex: 1 }}
          aria-label="Close full screen"
          onClick={() => setIsFullScreen(false)}
        >
          <IconX size={28} />
        </ActionIcon>
        <div
          ref={placeViewerTrack}
          className={styles.viewerTrack}
          onScroll={handleViewerScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Spot photos full screen"
        >
          {photos.map((photo, index) => (
            <Image
              key={photo.id}
              className={styles.viewerSlide}
              src={photo.imageUrl}
              alt={photo.caption ?? `Photo ${index + 1}`}
              fit="contain"
            />
          ))}
        </div>
      </Modal>

      {hasPhotoControls && (
        // One row: status and weather on the left, dots in the gap, all-photos button on the right.
        <Box
          px="md"
          pt="sm"
          style={{
            display: "grid",
            // Equal side columns keep the dots dead centre; labels that don't fit scroll sideways.
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
            alignItems: "center",
            columnGap: 12,
          }}
        >
          <Group
            gap={8}
            wrap="nowrap"
            fz="lg"
            miw={0}
            // Lots of weather emojis scroll sideways instead of pushing the button off screen.
            style={{
              overflowX: "auto",
              scrollbarWidth: "none",
              // Fades out an emoji cut off by the dots, hinting the row scrolls.
              maskImage: "linear-gradient(to right, black calc(100% - 20px), transparent)",
            }}
          >
            {labels}
          </Group>
          <Group justify="center" miw={0}>
            <PhotoDots count={photos.length} activeIndex={activeIndex} />
          </Group>
          <Group justify="flex-end" gap={8} wrap="nowrap">
            {onAdd && (
              <Button
                onClick={onAdd}
                h={40}
                px={10}
                radius="sm"
                autoContrast
                fw={900}
                leftSection={<IconPlus size={16} stroke={2.5} />}
                styles={{ section: { marginInlineEnd: 4 } }}
              >
                Add
              </Button>
            )}
            <Button
              aria-label={`See all ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}
              aria-haspopup="dialog"
              onClick={() => setIsGridOpen(true)}
              h={40}
              px={12}
              radius="sm"
              variant="default"
              leftSection={<IconLayoutGrid size={16} color={theme.colors.yellow[5]} />}
              styles={{
                root: {
                  backgroundColor: theme.colors.brown[6],
                  borderColor: theme.colors.brown[4],
                  color: theme.colors.brown[0],
                },
                section: { marginInlineEnd: 6 },
              }}
            >
              {photos.length}
            </Button>
          </Group>
        </Box>
      )}

      <Drawer
        opened={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        position="bottom"
        // Stays mounted while closed so a photo upload started here keeps going.
        keepMounted
        title={
          <Stack gap={2}>
            <Text component="span" ff="heading" fz={18} fw={600} c="brown.0">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </Text>
            <Text component="span" fz="sm" c="brown.1">
              {onReorder && photos.length > 1
                ? "Tap to view · hold and drag to reorder"
                : "Tap a photo to view it"}
            </Text>
          </Stack>
        }
        overlayProps={{ backgroundOpacity: 0.55 }}
        closeButtonProps={{ "aria-label": "Close all photos", size: "lg" }}
        styles={{
          content: {
            backgroundColor: theme.colors.brown[7],
            borderTop: `1px solid ${theme.colors.brown[4]}`,
            borderRadius: "20px 20px 0 0",
            maxWidth: "36rem",
            margin: "0 auto",
            height: "auto",
            maxHeight: "85dvh",
            flex: "none",
            width: "100%",
          },
          header: { backgroundColor: theme.colors.brown[7], alignItems: "flex-start" },
          // Room above the first row so the selected photo's outline and a lifted (dragged)
          // photo aren't clipped by the sheet's scroll area.
          body: { paddingTop: 8, paddingBottom: "var(--mantine-spacing-xl)" },
        }}
      >
        <PhotoThumbnails
          photos={photos}
          activeIndex={activeIndex}
          onSelect={(index) => {
            goToPhoto(index);
            setIsGridOpen(false);
          }}
          onReorder={onReorder}
          extraThumbnail={extraThumbnail}
        />
      </Drawer>
      {/* With no dots or button to share a row with, the labels get their own. */}
      {hasLabels && !hasPhotoControls && (
        <Group gap="sm" wrap="nowrap" px="md" pt="sm" pb={0} fz="xl">
          {labels}
        </Group>
      )}
    </Box>
  );
}
