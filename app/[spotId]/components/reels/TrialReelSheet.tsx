"use client";

import { api } from "@/app/providers";
import { isInstagramUrl } from "@/lib/photo-spots";
import type { TrialReel } from "@/server/routers/trialReels";
import { Button, Drawer, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconBrandInstagram, IconCheck } from "@tabler/icons-react";
import { useState } from "react";

type TrialReelSheetProps = {
  opened: boolean;
  // The link being edited; null adds a new one to the library.
  reel: TrialReel | null;
  onClose: () => void;
  // Called with the link's id once it's saved.
  onSaved?: (id: string) => void;
};

// Adds a link to the trial reel library, or edits one everywhere it's used. The creator's @ is
// typed by hand because Instagram doesn't share it with the link.
export function TrialReelSheet(props: TrialReelSheetProps) {
  return (
    <Drawer
      opened={props.opened}
      onClose={props.onClose}
      position="bottom"
      radius="xl"
      // Above the full-screen library it can open from.
      zIndex={400}
      // Size the sheet to its content, and keep it as wide as the spot page (30rem).
      styles={{
        inner: { justifyContent: "center" },
        content: { flex: "0 0 auto", height: "auto", width: "100%", maxWidth: "30rem" },
      }}
      title={
        <Stack gap={2}>
          <Text component="span" ff="heading" fz="lg" fw={600} c="brown.0">
            {props.reel ? "Edit trial reel" : "Add a trial reel idea"}
          </Text>
          <Text component="span" fz="sm" c="brown.1">
            {props.reel
              ? "Changes it on every spot that uses it."
              : "It joins your library, ready for any spot."}
          </Text>
        </Stack>
      }
    >
      {/* Remount each time it opens so the fields start from the saved link. */}
      {props.opened && <TrialReelForm key={props.reel?.id ?? "new"} {...props} />}
    </Drawer>
  );
}

function TrialReelForm({ reel, onClose, onSaved }: TrialReelSheetProps) {
  const utils = api.useUtils();
  const [url, setUrl] = useState(reel?.instagramUrl ?? "");
  const [creator, setCreator] = useState(reel?.creator?.replace(/^@/, "") ?? "");
  const [showError, setShowError] = useState(false);

  async function saved(id: string) {
    await utils.trialReels.invalidate();
    onSaved?.(id);
    onClose();
  }

  const create = api.trialReels.create.useMutation({ onSuccess: ({ id }) => saved(id) });
  const update = api.trialReels.update.useMutation({
    onSuccess: (_, { id }) => saved(id),
  });
  const isBusy = create.isPending || update.isPending;

  const trimmed = url.trim();
  const isValid = isInstagramUrl(trimmed);
  const error =
    create.error?.message ??
    update.error?.message ??
    (showError && !isValid
      ? trimmed
        ? "Paste a link from instagram.com, like a reel."
        : "Paste the reel's link first."
      : null);

  async function paste() {
    try {
      setUrl(await navigator.clipboard.readText());
      setShowError(true);
    } catch {
      // Clipboard access was refused; the field can still be pasted into by hand.
    }
  }

  function save() {
    setShowError(true);
    if (!isValid) return;
    if (reel) update.mutate({ id: reel.id, instagramUrl: trimmed, creator });
    else create.mutate({ instagramUrl: trimmed, creator });
  }

  return (
    <Stack gap="md" pb="md">
      <Stack gap={6}>
        <TextInput
          size="md"
          label="Reel link"
          placeholder="https://www.instagram.com/reel/…"
          leftSection={<IconBrandInstagram size={18} color="var(--mantine-color-yellow-5)" />}
          rightSection={
            <Button size="compact-sm" variant="default" onClick={paste}>
              Paste
            </Button>
          }
          rightSectionWidth={76}
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          onBlur={() => trimmed && setShowError(true)}
          error={error}
          inputMode="url"
          autoComplete="off"
          data-autofocus
        />
        {trimmed && isValid && (
          <Group gap={6}>
            <IconCheck size={14} color="var(--mantine-color-yellow-5)" />
            <Text fz="xs" c="brown.1">
              Looks like an Instagram link
            </Text>
          </Group>
        )}
      </Stack>

      <TextInput
        size="md"
        label="Creator (optional)"
        placeholder="their.handle"
        leftSection={
          <Text component="span" c="brown.1" fw={700} aria-hidden>
            @
          </Text>
        }
        value={creator}
        onChange={(event) => setCreator(event.currentTarget.value.replace(/^@+/, ""))}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={60}
      />

      <Group gap="sm" grow>
        <Button h={52} variant="default" onClick={onClose} disabled={isBusy}>
          Cancel
        </Button>
        <Button h={52} onClick={save} loading={isBusy} autoContrast>
          Save link
        </Button>
      </Group>
    </Stack>
  );
}
