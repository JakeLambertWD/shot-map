"use client";

import { api } from "@/app/providers";
import type { CreatorShot } from "@/server/routers/creatorShots";
import { MAX_SPOT_PHOTOS } from "@/lib/photo-spots";
import { getPhotoUploadErrorMessage, uploadSpotPhoto } from "@/lib/upload-spot-photo";
import {
  Box,
  Button,
  Center,
  FileButton,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconCheck, IconUpload } from "@tabler/icons-react";
import { useMemo, useState } from "react";

type CreatorLibraryPickerProps = {
  opened: boolean;
  onClose: () => void;
  spotId: string;
  spotTitle: string;
  // Image URLs of the creator shots already on this spot; they can't be picked again.
  usedImageUrls: string[];
  // Called with the index of the first newly added shot once they're saved.
  onAdded: (firstNewIndex: number) => void;
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

// Full-screen library of every creator shot. Pick shots to add to this spot, or upload new ones,
// which join the library (selected, ready to add).
export function CreatorLibraryPicker({
  opened,
  onClose,
  spotId,
  spotTitle,
  usedImageUrls,
  onAdded,
}: CreatorLibraryPickerProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: "slide-up", duration: 200 }}
      styles={{ content: { backgroundColor: "var(--mantine-color-body)" } }}
    >
      {/* Remounted on each open so the selection starts empty. */}
      {opened && (
        <PickerBody
          onClose={onClose}
          spotId={spotId}
          spotTitle={spotTitle}
          usedImageUrls={usedImageUrls}
          onAdded={onAdded}
        />
      )}
    </Modal>
  );
}

function PickerBody({
  onClose,
  spotId,
  spotTitle,
  usedImageUrls,
  onAdded,
}: Omit<CreatorLibraryPickerProps, "opened">) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const libraryQuery = api.creatorShots.list.useQuery();
  const addToLibrary = api.creatorShots.add.useMutation();
  const addPhotos = api.spots.addPhotos.useMutation();

  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const used = useMemo(() => new Set(usedImageUrls), [usedImageUrls]);
  const room = MAX_SPOT_PHOTOS - usedImageUrls.length;
  const isBusy = progress !== null || addPhotos.isPending;

  // Newest first, grouped under month headings.
  const months = useMemo(() => {
    const groups: { label: string; shots: CreatorShot[] }[] = [];
    for (const shot of libraryQuery.data ?? []) {
      const label = MONTH_FORMAT.format(new Date(shot.createdAt));
      const last = groups.at(-1);
      if (last?.label === label) last.shots.push(shot);
      else groups.push({ label, shots: [shot] });
    }
    return groups;
  }, [libraryQuery.data]);

  function toggle(imageUrl: string) {
    setError(null);
    setSelected((current) => {
      if (current.includes(imageUrl)) return current.filter((url) => url !== imageUrl);
      if (current.length >= room) {
        setError(`A spot can have up to ${MAX_SPOT_PHOTOS} creator shots.`);
        return current;
      }
      return [...current, imageUrl];
    });
  }

  async function handleUpload(files: File[]) {
    if (files.length === 0) return;
    setError(null);
    try {
      const imageUrls: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        imageUrls.push(await uploadSpotPhoto(file, spotTitle));
      }
      setProgress("Adding to your library…");
      await addToLibrary.mutateAsync({ imageUrls, originSpotId: spotId });
      await utils.creatorShots.list.invalidate();
      // New uploads start selected, up to the room left on this spot.
      setSelected((current) => [...current, ...imageUrls].slice(0, Math.max(room, 0)));
    } catch (uploadError) {
      setError(getPhotoUploadErrorMessage(uploadError));
    } finally {
      setProgress(null);
    }
  }

  async function handleAdd() {
    if (selected.length === 0) return;
    setError(null);
    try {
      await addPhotos.mutateAsync({
        spotId,
        kind: "creator",
        photos: selected.map((imageUrl) => ({ imageUrl, caption: "" })),
      });
      await Promise.all([
        utils.spots.byId.invalidate({ id: spotId }),
        utils.creatorShots.list.invalidate(),
      ]);
      onAdded(usedImageUrls.length);
      onClose();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Couldn't add the shots.");
    }
  }

  return (
    <Stack gap={0} h="100dvh">
      <Box
        component="header"
        h={56}
        px={8}
        style={{
          flex: "none",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          borderBottom: `1px solid ${theme.colors.brown[5]}`,
        }}
      >
        <UnstyledButton
          onClick={onClose}
          h={44}
          px={8}
          fz={15}
          fw={700}
          c="brown.0"
          style={{ justifySelf: "start" }}
        >
          Cancel
        </UnstyledButton>
        <Title order={2} fz={16} fw={600} c="brown.0">
          Creator shots
        </Title>
        <Button
          onClick={handleAdd}
          disabled={selected.length === 0 || isBusy}
          loading={addPhotos.isPending}
          radius="xl"
          h={36}
          px={14}
          fz={14}
          fw={900}
          autoContrast
          style={{ justifySelf: "end" }}
        >
          {selected.length > 0 ? `Add ${selected.length}` : "Add"}
        </Button>
      </Box>

      <Box px="md" pt="sm" pb={4} style={{ flex: "none" }}>
        <FileButton onChange={handleUpload} accept="image/*" multiple disabled={isBusy}>
          {(props) => (
            <Button
              {...props}
              fullWidth
              h={44}
              radius="sm"
              variant="default"
              leftSection={
                progress ? (
                  <Loader size="xs" color="yellow" />
                ) : (
                  <IconUpload size={18} color={theme.colors.yellow[5]} />
                )
              }
              styles={{
                root: {
                  backgroundColor: theme.colors.brown[6],
                  borderColor: theme.colors.brown[4],
                  color: theme.colors.brown[0],
                },
              }}
            >
              {progress ?? "Upload new shots"}
            </Button>
          )}
        </FileButton>
        {error && (
          <Text fz="sm" c="red.4" mt={6} role="alert">
            {error}
          </Text>
        )}
      </Box>

      <Box px="md" pb="xl" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {libraryQuery.isPending ? (
          <Center h={160}>
            <Loader color="yellow" size="sm" />
          </Center>
        ) : months.length === 0 ? (
          <Center h={160} c="brown.1" fz="sm" ta="center">
            No creator shots yet. Upload your first one above.
          </Center>
        ) : (
          months.map((month) => (
            <Box component="section" key={month.label} aria-label={month.label}>
              <Text component="h3" fz={13} fw={900} c="brown.1" mt="md" mb={8}>
                {month.label}
              </Text>
              <SimpleGrid cols={4} spacing={4}>
                {month.shots.map((shot) => {
                  const isUsed = used.has(shot.imageUrl);
                  const order = selected.indexOf(shot.imageUrl);
                  const isSelected = order !== -1;
                  return (
                    <UnstyledButton
                      key={shot.id}
                      aria-pressed={isSelected}
                      aria-label={
                        isUsed
                          ? "Creator shot, already on this spot"
                          : `Creator shot${shot.originSpotTitle ? ` taken at ${shot.originSpotTitle}` : ""}`
                      }
                      disabled={isUsed || isBusy}
                      onClick={() => toggle(shot.imageUrl)}
                      pos="relative"
                      style={{
                        aspectRatio: "1",
                        borderRadius: 4,
                        overflow: "hidden",
                        opacity: isUsed ? 0.4 : 1,
                      }}
                    >
                      <Image src={shot.imageUrl} alt="" w="100%" h="100%" fit="cover" />
                      {isSelected && (
                        <Box
                          aria-hidden
                          pos="absolute"
                          inset={0}
                          style={{
                            borderRadius: 4,
                            boxShadow: `inset 0 0 0 3px ${theme.colors.yellow[5]}`,
                          }}
                        />
                      )}
                      {isUsed ? (
                        <Text
                          component="span"
                          pos="absolute"
                          left={4}
                          bottom={4}
                          fz={10}
                          fw={700}
                          c="brown.0"
                          px={6}
                          style={{ borderRadius: 8, backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                        >
                          On this spot
                        </Text>
                      ) : (
                        <Center
                          aria-hidden
                          pos="absolute"
                          top={5}
                          right={5}
                          w={22}
                          h={22}
                          fz={11}
                          fw={900}
                          c="brown.9"
                          style={{
                            borderRadius: "50%",
                            boxSizing: "border-box",
                            backgroundColor: isSelected
                              ? theme.colors.yellow[5]
                              : "rgba(0, 0, 0, 0.35)",
                            border: isSelected ? "none" : `1.5px solid ${theme.colors.brown[0]}`,
                          }}
                        >
                          {isSelected &&
                            (selected.length > 1 ? (
                              order + 1
                            ) : (
                              <IconCheck size={13} stroke={3.5} />
                            ))}
                        </Center>
                      )}
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
            </Box>
          ))
        )}
      </Box>
    </Stack>
  );
}
