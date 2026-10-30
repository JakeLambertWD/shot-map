"use client";

import { api } from "@/app/providers";
import { MAX_SPOT_PHOTOS, type PhotoKind } from "@/lib/photo-spots";
import { getPhotoUploadErrorMessage, uploadSpotPhoto } from "@/lib/upload-spot-photo";
import { FileButton, Loader, UnstyledButton, useMantineTheme } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

type AddPhotosTileProps = {
  spotId: string;
  spotTitle: string;
  photoCount: number;
  kind?: PhotoKind;
  carouselId?: string | null;
  onProgress: (message: string | null) => void;
  onError: (message: string | null) => void;
  // Called with the index of the first new photo once they're saved.
  onAdded: (firstNewIndex: number) => void;
};

export function AddPhotosTile({
  spotId,
  spotTitle,
  photoCount,
  kind = "showcase",
  carouselId,
  onProgress,
  onError,
  onAdded,
}: AddPhotosTileProps) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const addPhotos = api.spots.addPhotos.useMutation();
  const [isUploading, setIsUploading] = useState(false);

  const room = MAX_SPOT_PHOTOS - photoCount;

  async function handleFiles(files: File[]) {
    const picked = files.slice(0, room);
    if (picked.length === 0) return;

    setIsUploading(true);
    onError(null);

    try {
      const photos = [];

      for (const [index, file] of picked.entries()) {
        onProgress(`Uploading photo ${index + 1} of ${picked.length}…`);
        photos.push({ imageUrl: await uploadSpotPhoto(file, spotTitle), caption: "" });
      }

      onProgress("Saving…");
      await addPhotos.mutateAsync({ spotId, photos, kind, carouselId });
      await Promise.all([
        utils.spots.byId.invalidate({ id: spotId }),
        utils.spots.list.invalidate(),
      ]);
      onAdded(photoCount);
    } catch (error) {
      onError(getPhotoUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
      onProgress(null);
    }
  }

  return (
    <FileButton onChange={handleFiles} accept="image/*" multiple>
      {(props) => (
        <UnstyledButton
          {...props}
          aria-label="Add photos"
          disabled={isUploading || room <= 0}
          bdrs="sm"
          display="flex"
          style={{
            minWidth: 0,
            aspectRatio: "1",
            alignItems: "center",
            justifyContent: "center",
            border: `1.5px dashed ${theme.colors.brown[2]}`,
            opacity: room <= 0 ? 0.4 : 1,
          }}
        >
          {isUploading ? (
            <Loader size="sm" color="yellow" />
          ) : (
            <IconPlus size={22} color={theme.colors.brown[1]} />
          )}
        </UnstyledButton>
      )}
    </FileButton>
  );
}
