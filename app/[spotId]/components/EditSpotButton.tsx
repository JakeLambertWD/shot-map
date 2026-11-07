"use client";

import { SpotToggle } from "@/app/components/add-spot/SpotToggle";
import { WeatherPill } from "@/app/components/add-spot/WeatherPill";
import { useSortedSpotTags } from "@/app/components/add-spot/useSortedSpotTags";
import { api } from "@/app/providers";
import {
  applySpotTitleCase,
  MAX_SPOT_TAGS,
  SPOT_GEAR_OPTIONS,
  SPOT_POSTED_OPTIONS,
  SPOT_STATUS_OPTIONS,
  type SpotGear,
  type SpotStatus,
} from "@/lib/photo-spots";
import { getPhotoUploadErrorMessage } from "@/lib/upload-spot-photo";
import type { SpotDetail } from "@/server/routers/spots";
import {
  ActionIcon,
  Group,
  Image,
  Input,
  Modal,
  MultiSelect,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  SPOT_FORM_MODAL_TITLE_STYLES,
  SpotFormModalTitle,
  SpotFormStatus,
} from "@/app/components/add-spot/SpotFormModalTitle";

type EditSpotButtonProps = {
  spot: SpotDetail;
};

type EditSpotFormProps = EditSpotButtonProps & {
  formId: string;
  onSavingChange: (isSaving: boolean) => void;
  onDone: () => void;
};

function EditSpotForm({ spot, formId, onSavingChange, onDone }: EditSpotFormProps) {
  const utils = api.useUtils();
  const updateSpot = api.spots.update.useMutation();
  const deletePhoto = api.spots.deletePhoto.useMutation();

  const [title, setTitle] = useState(spot.title);
  const postcode = spot.postcode ?? "";
  const [status, setStatus] = useState<SpotStatus>(spot.status);
  const [gear, setGear] = useState<SpotGear>(spot.gear);
  const [posted, setPosted] = useState(spot.posted);
  const [tags, setTags] = useState<string[]>(spot.tags);
  const sortedTags = useSortedSpotTags(spot.tags);
  const [photos, setPhotos] = useState(spot.photos);
  const [creatorPhotos, setCreatorPhotos] = useState(spot.creatorPhotos);
  const [editingPhotos, setEditingPhotos] = useState(spot.editingPhotos);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSaving = progress !== null;

  // The Save button lives in the modal header, so it needs to know when we're saving.
  useEffect(() => onSavingChange(isSaving), [isSaving, onSavingChange]);

  function removePhoto(id: string) {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
    setCreatorPhotos((current) => current.filter((photo) => photo.id !== id));
    setEditingPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setTitleError("Give the spot a name");
      return;
    }

    setTitleError(null);
    setError(null);
    setProgress("Saving…");

    try {
      await updateSpot.mutateAsync({
        id: spot.id,
        title,
        postcode,
        status,
        gear,
        tags,
        posted,
      });

      const keptIds = new Set(
        [...photos, ...creatorPhotos, ...editingPhotos].map((photo) => photo.id),
      );
      const removed = [...spot.photos, ...spot.creatorPhotos, ...spot.editingPhotos].filter(
        (photo) => !keptIds.has(photo.id),
      );
      for (const photo of removed) await deletePhoto.mutateAsync({ photoId: photo.id });

      await Promise.all([
        utils.spots.byId.invalidate({ id: spot.id }),
        utils.spots.list.invalidate(),
      ]);
      onDone();
    } catch (submitError) {
      setError(getPhotoUploadErrorMessage(submitError));
      setProgress(null);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Stack gap="md" pb="sm">
        <SpotFormStatus progress={progress} error={error} />

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

        <SpotToggle
          label="Posted"
          options={SPOT_POSTED_OPTIONS}
          value={posted ? "yes" : "no"}
          onChange={(value) => setPosted(value === "yes")}
        />

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

        {[
          // One list per Showcase carousel, then the other photo tabs.
          ...spot.carousels.map((carousel) => {
            const ids = new Set(carousel.photos.map((photo) => photo.id));
            return [carousel.title, photos.filter((photo) => ids.has(photo.id))] as const;
          }),
          ["Creator shots", creatorPhotos] as const,
          ["Editing photos", editingPhotos] as const,
        ].map(
          ([label, list]) =>
            list.length > 0 && (
              <Input.Wrapper key={`${label}-${list[0]?.id}`} label={label}>
                <Stack gap="sm" mt="xs">
                  {list.map((photo, index) => (
                    <Group key={photo.id} wrap="nowrap" gap="sm">
                      <Image
                        src={photo.imageUrl}
                        alt={`${label} ${index + 1}`}
                        w={72}
                        h={72}
                        radius="sm"
                        fit="cover"
                      />
                      <ActionIcon
                        variant="transparent"
                        color="red.5"
                        size={44}
                        aria-label={`Remove photo ${index + 1} from ${label}`}
                        onClick={() => removePhoto(photo.id)}
                        disabled={isSaving}
                      >
                        <IconTrash size={24} stroke={1.75} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Input.Wrapper>
            ),
        )}
      </Stack>
    </form>
  );
}

const EDIT_SPOT_FORM_ID = "edit-spot-form";

type EditSpotModalProps = EditSpotButtonProps & {
  opened: boolean;
  onClose: () => void;
};

// The edit spot form in a full-height modal. Opened from the spot menu.
export function EditSpotModal({ spot, opened, onClose }: EditSpotModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <SpotFormModalTitle title="Edit spot" formId={EDIT_SPOT_FORM_ID} isSaving={isSaving} />
      }
      yOffset="var(--mantine-spacing-lg)"
      styles={{
        content: {
          height: "calc(100dvh - 2 * var(--mantine-spacing-lg))",
          display: "flex",
          flexDirection: "column",
        },
        title: SPOT_FORM_MODAL_TITLE_STYLES,
        body: { flex: 1, minHeight: 0, overflowY: "auto" },
      }}
    >
      {opened && (
        <EditSpotForm
          spot={spot}
          formId={EDIT_SPOT_FORM_ID}
          onSavingChange={setIsSaving}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}
