"use client";

import { api } from "@/app/providers";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";

type DeleteSpotModalProps = {
  spotId: string;
  title: string;
  photoCount: number;
  opened: boolean;
  onClose: () => void;
};

// Confirms before deleting the spot, then goes back to the map. Opened from the spot menu.
export function DeleteSpotModal({
  spotId,
  title,
  photoCount,
  opened,
  onClose,
}: DeleteSpotModalProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const deleteSpot = api.spots.delete.useMutation({
    onSuccess: async () => {
      await utils.spots.list.invalidate();
      router.push("/");
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Delete this spot?" centered>
      <Stack gap="md">
        <Text fz="sm">
          <strong>{title}</strong> and its {photoCount} {photoCount === 1 ? "photo" : "photos"} will
          be removed from the map. This can&apos;t be undone.
        </Text>
        {deleteSpot.error && (
          <Text fz="sm" c="red.5" role="alert">
            {deleteSpot.error.message}
          </Text>
        )}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={deleteSpot.isPending}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteSpot.isPending}
            onClick={() => deleteSpot.mutate({ id: spotId })}
          >
            Delete spot
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
