"use client";

import { CAN_EDIT_SPOTS, type PhotoKind } from "@/lib/photo-spots";
import type { SpotDetail } from "@/server/routers/spots";
import { Box, Button, Center, Group, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { api } from "@/app/providers";
import { useMemo, useState, type ReactNode } from "react";
import { AddFromShowcaseSelect } from "./AddFromShowcaseSelect";
import { AddPhotosTile } from "./AddPhotosTile";
import { CreatorLibraryPicker } from "./CreatorLibraryPicker";
import { RemoveCreatorShotSheet } from "./RemoveCreatorShotSheet";
import { PhotoCaption } from "./PhotoCaption";
import { SpotPhotoCarousel } from "./SpotPhotoCarousel";
import { SpotStatusIcon } from "./SpotStatusIcon";

type SpotPhotoTabProps = {
  spot: SpotDetail;
  photos: SpotDetail["photos"];
  kind: PhotoKind;
  // Showcase only: the carousel new photos are added to.
  carouselId?: string | null;
  // Status badge and gear, shown at the start of the weather row. Left out, the row is hidden.
  labels?: ReactNode;
  // Shown under the photo note, e.g. editing notes.
  children?: ReactNode;
};

// A photo carousel with a note per photo. Used by the Showcase, Creator Shots and Editing tabs.
export function SpotPhotoTab({
  spot,
  photos: savedPhotos,
  kind,
  carouselId,
  labels,
  children,
}: SpotPhotoTabProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // The order just dragged into, shown straight away while it saves.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const utils = api.useUtils();
  const reorderPhotos = api.spots.reorderPhotos.useMutation();

  const photos = useMemo(() => {
    if (!pendingOrder) return savedPhotos;
    const byId = new Map(savedPhotos.map((photo) => [photo.id, photo]));
    const ordered = pendingOrder.flatMap((id) => byId.get(id) ?? []);
    // Photos added since the drag stay at the end.
    return ordered.concat(savedPhotos.filter((photo) => !pendingOrder.includes(photo.id)));
  }, [savedPhotos, pendingOrder]);

  async function handleReorder(photoIds: string[], movedPhotoId: string) {
    // Keep showing the photo that was on screen, wherever it moved to.
    const shownId = photos[photoIndex]?.id;
    setPendingOrder(photoIds);
    setActiveIndex(Math.max(0, photoIds.indexOf(shownId ?? movedPhotoId)));
    setUploadError(null);
    try {
      await reorderPhotos.mutateAsync({ spotId: spot.id, photoIds });
      // The first Showcase photo is the map pin, so refresh the map's list too.
      await Promise.all([
        utils.spots.byId.invalidate({ id: spot.id }),
        utils.spots.list.invalidate(),
      ]);
    } catch {
      setUploadError("Couldn't save the new photo order. Try again.");
    } finally {
      setPendingOrder(null);
    }
  }

  // A photo may have just been removed, so never point past the end of the list.
  const photoIndex = Math.max(0, Math.min(activeIndex, photos.length - 1));
  const activePhoto = photos[photoIndex];

  // Creator shots come from the shared library (where new ones are uploaded too).
  const usesLibrary = kind === "creator" && CAN_EDIT_SPOTS;
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [photoToRemove, setPhotoToRemove] = useState<SpotDetail["photos"][number] | null>(null);

  const addPhotosTile = CAN_EDIT_SPOTS && !usesLibrary && (
    <AddPhotosTile
      spotId={spot.id}
      spotTitle={spot.title}
      photoCount={photos.length}
      kind={kind}
      carouselId={carouselId}
      onProgress={setProgress}
      onError={setUploadError}
      onAdded={setActiveIndex}
    />
  );

  return (
    <>
      {photos.length > 0 ? (
        <SpotPhotoCarousel
          photos={photos}
          tags={labels ? spot.tags : []}
          tagsLeading={labels}
          status={labels ? spot.status : undefined}
          activeIndex={photoIndex}
          onActiveIndexChange={setActiveIndex}
          extraThumbnail={addPhotosTile}
          onReorder={CAN_EDIT_SPOTS ? handleReorder : undefined}
          onAdd={usesLibrary ? () => setIsLibraryOpen(true) : undefined}
          onRemove={usesLibrary ? setPhotoToRemove : undefined}
        />
      ) : (
        <>
          <Center h={200} bg="brown.7" c="brown.1" fz="sm">
            No photos yet
          </Center>
          {addPhotosTile && (
            <Group px="md" pb="sm" pt="lg">
              {addPhotosTile}
            </Group>
          )}
          {usesLibrary && (
            <Group px="md" pb="sm" pt="lg">
              <Button
                h={44}
                radius="sm"
                autoContrast
                fw={900}
                leftSection={<IconPlus size={18} stroke={2.5} />}
                onClick={() => setIsLibraryOpen(true)}
              >
                Add creator shots
              </Button>
            </Group>
          )}
        </>
      )}

      {usesLibrary && (
        <CreatorLibraryPicker
          opened={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          spotId={spot.id}
          spotTitle={spot.title}
          usedImageUrls={photos.map((photo) => photo.imageUrl)}
          onAdded={setActiveIndex}
        />
      )}

      {usesLibrary && (
        <RemoveCreatorShotSheet
          photo={photoToRemove}
          spotTitle={spot.title}
          onClose={() => setPhotoToRemove(null)}
        />
      )}

      {CAN_EDIT_SPOTS && kind === "editing" && (
        <Box px="md" pt="sm">
          <AddFromShowcaseSelect
            spotId={spot.id}
            showcasePhotos={spot.photos}
            editingPhotos={photos}
            onError={setUploadError}
            onAdded={setActiveIndex}
          />
        </Box>
      )}

      {(progress || uploadError) && (
        <Text
          fz="sm"
          px="md"
          c={uploadError ? "red.5" : "brown.1"}
          role={uploadError ? "alert" : "status"}
        >
          {uploadError ?? progress}
        </Text>
      )}

      <Stack gap="lg" px="md" pt="sm">
        {photos.length === 0 && labels && (
          <Group gap="sm" wrap="nowrap" fz="xl">
            <SpotStatusIcon status={spot.status} />
            {labels}
          </Group>
        )}

        {activePhoto && (
          <PhotoCaption
            key={activePhoto.id}
            spotId={spot.id}
            photoId={activePhoto.id}
            photoIndex={photoIndex}
            caption={activePhoto.caption}
          />
        )}

        {children}
      </Stack>
    </>
  );
}
