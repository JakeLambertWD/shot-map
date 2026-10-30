"use client";

import { api } from "@/app/providers";
import {
  applySpotTitleCase,
  DEFAULT_SPOT_GEAR,
  DEFAULT_SPOT_STATUS,
  formatSpotTitle,
  MAX_SPOT_PHOTOS,
  MAX_SPOT_TAGS,
  SPOT_GEAR_OPTIONS,
  SPOT_STATUS_OPTIONS,
  type SpotGear,
  type SpotStatus,
} from "@/lib/photo-spots";
import { findNearestPostcode } from "@/lib/postcodes";
import { getPhotoUploadErrorMessage, uploadSpotPhoto } from "@/lib/upload-spot-photo";
import {
  ActionIcon,
  Badge,
  Button,
  FileButton,
  Group,
  Image,
  Input,
  MultiSelect,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { IconMapPin, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SpotFormStatus } from "./SpotFormModalTitle";
import { SpotToggle } from "./SpotToggle";
import { WeatherPill } from "./WeatherPill";
import { useSortedSpotTags } from "./useSortedSpotTags";

export type DraftLocation = {
  latitude: number;
  longitude: number;
};

type DraftPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
};

type AddSpotFormProps = {
  location: DraftLocation;
  // Pre-fills the name, e.g. with the place the user searched for.
  initialTitle?: string;
  formId: string;
  onSavingChange: (isSaving: boolean) => void;
  onCreated: (spotId: string) => void;
};

export function AddSpotForm({
  location,
  initialTitle = "",
  formId,
  onSavingChange,
  onCreated,
}: AddSpotFormProps) {
  const sortedTags = useSortedSpotTags();
  const utils = api.useUtils();
  const createSpot = api.spots.create.useMutation();

  const [title, setTitle] = useState(() => formatSpotTitle(initialTitle));
  const [titleError, setTitleError] = useState<string | null>(null);
  const [postcode, setPostcode] = useState("");
  const [status, setStatus] = useState<SpotStatus>(DEFAULT_SPOT_STATUS);
  const [gear, setGear] = useState<SpotGear>(DEFAULT_SPOT_GEAR);
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSaving = progress !== null;

  // The Save button lives in the modal header, so it needs to know when we're saving.
  useEffect(() => onSavingChange(isSaving), [isSaving, onSavingChange]);

  // Fill in the nearest postcode to wherever the pin was dropped.
  useEffect(() => {
    let isCancelled = false;
    findNearestPostcode(location.latitude, location.longitude)
      .then((nearest) => {
        if (!isCancelled && nearest) setPostcode((current) => current || nearest);
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [location]);

  // Free the in-memory previews when the form closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)),
    [],
  );

  // crypto.randomUUID() only exists on HTTPS, which breaks testing over the local network.
  const nextPhotoId = useRef(0);

  function addPhotos(files: File[]) {
    const room = MAX_SPOT_PHOTOS - photos.length;
    const added = files.slice(0, room).map((file) => ({
      id: `photo-${nextPhotoId.current++}`,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
    }));

    setPhotos((current) => [...current, ...added]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function makeCover(id: string) {
    setPhotos((current) => {
      const cover = current.find((photo) => photo.id === id);
      return cover ? [cover, ...current.filter((photo) => photo.id !== id)] : current;
    });
  }

  function updateCaption(id: string, caption: string) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, caption } : photo)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setTitleError("Give the spot a name");
      return;
    }

    setTitleError(null);
    setError(null);

    try {
      const uploadedPhotos = [];

      for (const [index, photo] of photos.entries()) {
        setProgress(`Uploading photo ${index + 1} of ${photos.length}…`);

        const imageUrl = await uploadSpotPhoto(photo.file, title);
        uploadedPhotos.push({ imageUrl, caption: photo.caption });
      }

      setProgress("Saving spot…");

      const { id } = await createSpot.mutateAsync({
        title,
        postcode,
        latitude: location.latitude,
        longitude: location.longitude,
        status,
        gear,
        tags,
        photos: uploadedPhotos,
      });

      await utils.spots.list.invalidate();
      onCreated(id);
    } catch (submitError) {
      setError(getPhotoUploadErrorMessage(submitError));
      setProgress(null);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Stack gap="md">
        <SpotFormStatus progress={progress} error={error} />

        {postcode && (
          <Group gap="xs" wrap="nowrap" c="dimmed">
            <IconMapPin size={16} aria-hidden />
            <Text fz="sm">Near {postcode}</Text>
          </Group>
        )}

        <TextInput
          size="md"
          label="Name"
          value={title}
          onChange={(event) => setTitle(applySpotTitleCase(event.currentTarget))}
          error={titleError}
          maxLength={120}
          withAsterisk
          data-autofocus
        />

        <SpotToggle
          label="Status"
          options={SPOT_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />

        <SpotToggle label="Gear" options={SPOT_GEAR_OPTIONS} value={gear} onChange={setGear} />

        <MultiSelect
          size="md"
          className="weather-select"
          renderPill={({ value }) => <WeatherPill value={value ?? ""} />}
          label="Weather"
          data={sortedTags}
          value={tags}
          onChange={setTags}
          maxValues={MAX_SPOT_TAGS}
        />

        <Input.Wrapper
          label="Photos"
          description={`Up to ${MAX_SPOT_PHOTOS}. The first photo is used as the map pin.`}
        >
          <Stack gap="sm" mt="xs">
            {photos.map((photo, index) => (
              <Group key={photo.id} align="flex-start" wrap="nowrap" gap="sm">
                <Image
                  src={photo.previewUrl}
                  alt={`Photo ${index + 1}`}
                  w={72}
                  h={72}
                  radius="sm"
                  fit="cover"
                  style={{ flexShrink: 0 }}
                />
                <Stack gap="xs" flex={1} miw={0}>
                  <Textarea
                    size="md"
                    aria-label={`Note for photo ${index + 1}`}
                    value={photo.caption}
                    onChange={(event) => updateCaption(photo.id, event.currentTarget.value)}
                    autosize
                    minRows={2}
                    maxLength={2000}
                  />
                  <Group gap="xs" justify="space-between">
                    {index === 0 ? (
                      <Badge variant="light" size="sm">
                        Map pin
                      </Badge>
                    ) : (
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => makeCover(photo.id)}
                        disabled={isSaving}
                      >
                        Use as map pin
                      </Button>
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() => removePhoto(photo.id)}
                      disabled={isSaving}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Group>
            ))}

            <FileButton onChange={addPhotos} accept="image/*" multiple>
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<IconPhotoPlus size={18} />}
                  disabled={isSaving || photos.length >= MAX_SPOT_PHOTOS}
                >
                  {photos.length === 0 ? "Add photos" : "Add more photos"}
                </Button>
              )}
            </FileButton>
          </Stack>
        </Input.Wrapper>
      </Stack>
    </form>
  );
}
