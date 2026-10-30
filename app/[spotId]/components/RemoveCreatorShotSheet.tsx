"use client";

import { api } from "@/app/providers";
import type { SpotDetail } from "@/server/routers/spots";
import { Box, Button, Drawer, Group, Image, Stack, Text, useMantineTheme } from "@mantine/core";
import { useState } from "react";

type Photo = SpotDetail["photos"][number];

type RemoveCreatorShotSheetProps = {
  // The shot to remove; null keeps the sheet closed.
  photo: Photo | null;
  spotTitle: string;
  onClose: () => void;
};

// Asks how to remove a creator shot: just from this spot (it stays in the library), or from
// the library and every spot, which needs a second, explicit confirmation.
export function RemoveCreatorShotSheet({ photo, spotTitle, onClose }: RemoveCreatorShotSheetProps) {
  const theme = useMantineTheme();

  return (
    <Drawer
      opened={photo !== null}
      onClose={onClose}
      position="bottom"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.6 }}
      styles={{
        content: {
          backgroundColor: theme.colors.brown[7],
          borderTop: `1px solid ${theme.colors.brown[4]}`,
          borderRadius: "20px 20px 0 0",
          maxWidth: "36rem",
          margin: "0 auto",
          height: "auto",
          flex: "none",
          width: "100%",
        },
        body: { padding: "20px 20px 24px" },
      }}
    >
      {/* Remounted per photo so the confirm step always starts closed. */}
      {photo && <SheetBody key={photo.id} photo={photo} spotTitle={spotTitle} onClose={onClose} />}
    </Drawer>
  );
}

function SheetBody({
  photo,
  spotTitle,
  onClose,
}: Omit<RemoveCreatorShotSheetProps, "photo"> & { photo: Photo }) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const usage = api.creatorShots.usage.useQuery({ imageUrl: photo.imageUrl });
  const otherSpots = Math.max((usage.data?.spotCount ?? 1) - 1, 0);

  async function refresh() {
    await Promise.all([
      // Other spots may have shown this shot too.
      utils.spots.byId.invalidate(),
      utils.creatorShots.invalidate(),
    ]);
  }

  const removeFromSpot = api.spots.deletePhoto.useMutation({
    onSuccess: async () => (await refresh(), onClose()),
  });
  const deleteEverywhere = api.creatorShots.deleteEverywhere.useMutation({
    onSuccess: async () => (await refresh(), onClose()),
  });
  const isBusy = removeFromSpot.isPending || deleteEverywhere.isPending;
  const error = removeFromSpot.error?.message ?? deleteEverywhere.error?.message;

  const elsewhere =
    otherSpots === 0
      ? "It stays in your creator shot library."
      : `It stays in your library and on the ${otherSpots} other ${
          otherSpots === 1 ? "spot" : "spots"
        } using it.`;

  return (
    <Stack gap="md">
      <Group gap={14} wrap="nowrap" align="center">
        <Box w={64} h={80} style={{ flex: "none", borderRadius: 8, overflow: "hidden" }}>
          <Image src={photo.imageUrl} alt="" w="100%" h="100%" fit="cover" />
        </Box>
        {isConfirmingDelete ? (
          <Stack gap={4}>
            <Text component="h2" ff="heading" fz={17} fw={600} c="brown.0" m={0}>
              Delete this shot everywhere?
            </Text>
            <Text fz="sm" c="brown.1" lh={1.4}>
              It comes off {otherSpots + 1 === 1 ? "this spot" : `all ${otherSpots + 1} spots`}, out
              of your library, and the photo is deleted. This can&apos;t be undone.
            </Text>
          </Stack>
        ) : (
          <Stack gap={4}>
            <Text component="h2" ff="heading" fz={17} fw={600} c="brown.0" m={0}>
              Remove from {spotTitle}?
            </Text>
            <Text fz="sm" c="brown.1" lh={1.4}>
              {elsewhere} Its note here is removed.
            </Text>
          </Stack>
        )}
      </Group>

      {error && (
        <Text fz="sm" c="red.4" role="alert">
          {error}
        </Text>
      )}

      {isConfirmingDelete ? (
        <>
          <Button
            h={52}
            radius="sm"
            color="red.7"
            fz={15}
            fw={900}
            loading={deleteEverywhere.isPending}
            onClick={() => deleteEverywhere.mutate({ imageUrl: photo.imageUrl })}
          >
            Delete everywhere
          </Button>
          <Button
            h={44}
            radius="sm"
            variant="outline"
            color={theme.colors.brown[3]}
            c="brown.0"
            disabled={isBusy}
            onClick={() => setIsConfirmingDelete(false)}
          >
            Back
          </Button>
        </>
      ) : (
        <>
          <Button
            h={52}
            radius="sm"
            autoContrast
            fz={15}
            fw={900}
            loading={removeFromSpot.isPending}
            disabled={isBusy}
            onClick={() => removeFromSpot.mutate({ photoId: photo.id })}
          >
            Remove from this spot
          </Button>
          <Button
            h={44}
            radius="sm"
            variant="outline"
            color={theme.colors.brown[3]}
            c="brown.0"
            disabled={isBusy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            h={44}
            variant="subtle"
            color="red.4"
            disabled={isBusy}
            onClick={() => setIsConfirmingDelete(true)}
          >
            Delete from the library everywhere
          </Button>
        </>
      )}
    </Stack>
  );
}
