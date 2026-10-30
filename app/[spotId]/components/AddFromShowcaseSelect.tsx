"use client";

import { api } from "@/app/providers";
import { MAX_SPOT_PHOTOS } from "@/lib/photo-spots";
import { getPhotoUploadErrorMessage } from "@/lib/upload-spot-photo";
import type { SpotDetail } from "@/server/routers/spots";
import { Group, Image, Select, Text } from "@mantine/core";
import { useState } from "react";

type AddFromShowcaseSelectProps = {
  spotId: string;
  showcasePhotos: SpotDetail["photos"];
  editingPhotos: SpotDetail["photos"];
  onError: (message: string | null) => void;
  // Called with the index of the photo once it's added.
  onAdded: (index: number) => void;
};

// Reuses a Showcase photo in the Editing tab, so it doesn't need uploading again.
export function AddFromShowcaseSelect({
  spotId,
  showcasePhotos,
  editingPhotos,
  onError,
  onAdded,
}: AddFromShowcaseSelectProps) {
  const utils = api.useUtils();
  const addPhotos = api.spots.addPhotos.useMutation();
  const [isAdding, setIsAdding] = useState(false);

  const usedUrls = new Set(editingPhotos.map((photo) => photo.imageUrl));
  const options = showcasePhotos
    .map((photo, index) => ({
      value: photo.id,
      label: photo.caption ? `Photo ${index + 1} · ${photo.caption}` : `Photo ${index + 1}`,
      photo,
    }))
    .filter((option) => !usedUrls.has(option.photo.imageUrl));

  const isFull = editingPhotos.length >= MAX_SPOT_PHOTOS;

  if (showcasePhotos.length === 0) return null;

  async function handleChange(photoId: string | null) {
    const photo = showcasePhotos.find((item) => item.id === photoId);
    if (!photo) return;

    setIsAdding(true);
    onError(null);

    try {
      await addPhotos.mutateAsync({
        spotId,
        kind: "editing",
        photos: [{ imageUrl: photo.imageUrl, caption: "" }],
      });
      await utils.spots.byId.invalidate({ id: spotId });
      onAdded(editingPhotos.length);
    } catch (error) {
      onError(getPhotoUploadErrorMessage(error));
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Select
      size="md"
      label="Add from Showcase"
      placeholder={
        isFull
          ? `The Editing tab is full (${MAX_SPOT_PHOTOS} photos)`
          : options.length === 0
            ? "All Showcase photos are already here"
            : "Choose a Showcase photo"
      }
      data={options.map(({ value, label }) => ({ value, label }))}
      value={null}
      onChange={handleChange}
      disabled={isAdding || isFull || options.length === 0}
      maxDropdownHeight={320}
      renderOption={({ option }) => {
        const match = options.find((item) => item.value === option.value);

        return (
          <Group gap="sm" wrap="nowrap">
            {match && (
              <Image src={match.photo.imageUrl} alt="" w={48} h={48} radius="sm" fit="cover" />
            )}
            <Text fz="sm" lineClamp={2}>
              {option.label}
            </Text>
          </Group>
        );
      }}
    />
  );
}
