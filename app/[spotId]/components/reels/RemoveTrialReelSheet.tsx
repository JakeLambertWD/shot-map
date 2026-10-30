"use client";

import { api } from "@/app/providers";
import type { TrialReel } from "@/server/routers/trialReels";
import { Box, Button, Drawer, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import { useState } from "react";
import { getTrialReelLabel, TrialReelTileFace } from "./TrialReelTileFace";

type RemoveTrialReelSheetProps = {
  // The link the sheet is for; null keeps it closed.
  reel: TrialReel | null;
  spotId: string;
  spotTitle: string;
  onClose: () => void;
  onEdit: (reel: TrialReel) => void;
};

// A trial reel's options on a spot: edit it, take it off this spot (it stays in the library),
// or delete it from the library and every spot, which needs a second confirmation.
export function RemoveTrialReelSheet(props: RemoveTrialReelSheetProps) {
  const theme = useMantineTheme();

  return (
    <Drawer
      opened={props.reel !== null}
      onClose={props.onClose}
      position="bottom"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.6 }}
      styles={{
        content: {
          backgroundColor: theme.colors.brown[7],
          borderTop: `1px solid ${theme.colors.brown[4]}`,
          borderRadius: "20px 20px 0 0",
          maxWidth: "30rem",
          margin: "0 auto",
          height: "auto",
          flex: "none",
          width: "100%",
        },
        body: { padding: "20px 20px 24px" },
      }}
    >
      {/* Remounted per link so the confirm step always starts closed. */}
      {props.reel && <SheetBody key={props.reel.id} {...props} reel={props.reel} />}
    </Drawer>
  );
}

function SheetBody({
  reel,
  spotId,
  spotTitle,
  onClose,
  onEdit,
}: RemoveTrialReelSheetProps & { reel: TrialReel }) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const usage = api.trialReels.usage.useQuery({ id: reel.id });
  const spotCount = usage.data?.spotCount ?? 1;
  const otherSpots = Math.max(spotCount - 1, 0);

  async function done() {
    await utils.trialReels.invalidate();
    onClose();
  }

  const removeFromSpot = api.trialReels.removeFromSpot.useMutation({ onSuccess: done });
  const deleteEverywhere = api.trialReels.deleteEverywhere.useMutation({ onSuccess: done });
  const isBusy = removeFromSpot.isPending || deleteEverywhere.isPending;
  const error = removeFromSpot.error?.message ?? deleteEverywhere.error?.message;

  const elsewhere =
    otherSpots === 0
      ? "It stays in your trial reel library."
      : `It stays in your library and on the ${otherSpots} other ${
          otherSpots === 1 ? "spot" : "spots"
        } using it.`;

  const outlineButton = {
    h: 44,
    radius: "sm",
    variant: "outline",
    color: theme.colors.brown[3],
    c: "brown.0",
    disabled: isBusy,
  } as const;

  return (
    <Stack gap="md">
      <Group gap={14} wrap="nowrap" align="center">
        <Box
          w={45}
          h={80}
          pos="relative"
          style={{ flex: "none", borderRadius: 6, overflow: "hidden" }}
        >
          <TrialReelTileFace reel={reel} />
        </Box>
        <Stack gap={4} miw={0}>
          <Text component="h2" ff="heading" fz={17} fw={600} c="brown.0" m={0}>
            {isConfirmingDelete ? "Delete this link everywhere?" : getTrialReelLabel(reel)}
          </Text>
          <Text fz="sm" c="brown.1" lh={1.4}>
            {isConfirmingDelete
              ? `It comes off ${spotCount === 1 ? "this spot" : `all ${spotCount} spots`} and out of your library. This can't be undone.`
              : reel.instagramUrl.replace("https://www.", "")}
          </Text>
        </Stack>
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
            onClick={() => deleteEverywhere.mutate({ id: reel.id })}
          >
            Delete everywhere
          </Button>
          <Button {...outlineButton} onClick={() => setIsConfirmingDelete(false)}>
            Back
          </Button>
        </>
      ) : (
        <>
          <Stack gap={6}>
            <Button
              h={52}
              radius="sm"
              autoContrast
              fz={15}
              fw={900}
              loading={removeFromSpot.isPending}
              disabled={isBusy}
              onClick={() => removeFromSpot.mutate({ spotId, id: reel.id })}
            >
              Remove from {spotTitle}
            </Button>
            <Text fz="xs" c="brown.1" ta="center">
              {elsewhere}
            </Text>
          </Stack>
          <Button {...outlineButton} onClick={() => onEdit(reel)}>
            Edit link or creator
          </Button>
          <Button {...outlineButton} onClick={onClose}>
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
