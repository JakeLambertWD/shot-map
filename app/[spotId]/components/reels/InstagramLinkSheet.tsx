"use client";

import { isInstagramUrl } from "@/lib/photo-spots";
import { Button, Drawer, Group, Stack, Text, TextInput } from "@mantine/core";
import { IconBrandInstagram, IconCheck } from "@tabler/icons-react";
import { useState } from "react";

type InstagramLinkSheetProps = {
  reelTitle: string;
  currentUrl: string | null;
  opened: boolean;
  onClose: () => void;
  // Saves the link, or removes it with null. Rejects with the reason it couldn't be saved.
  onSave: (instagramUrl: string | null) => Promise<unknown>;
};

export function InstagramLinkSheet(props: InstagramLinkSheetProps) {
  return (
    <Drawer
      opened={props.opened}
      onClose={props.onClose}
      position="bottom"
      radius="xl"
      // Size the sheet to its content, and keep it as wide as the spot page (30rem).
      styles={{
        inner: { justifyContent: "center" },
        content: { flex: "0 0 auto", height: "auto", width: "100%", maxWidth: "30rem" },
      }}
      title={
        <Stack gap={2}>
          <Text component="span" ff="heading" fz="lg" fw={600} c="brown.0">
            Instagram inspo
          </Text>
          <Text component="span" fz="sm" c="brown.1">
            For “{props.reelTitle}”
          </Text>
        </Stack>
      }
    >
      {/* Remount each time it opens so the field starts from the saved link. */}
      {props.opened && <InstagramLinkForm {...props} />}
    </Drawer>
  );
}

function InstagramLinkForm({ currentUrl, onClose, onSave }: InstagramLinkSheetProps) {
  const [value, setValue] = useState(currentUrl ?? "");
  const [showError, setShowError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveUrl(instagramUrl: string | null) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(instagramUrl);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save the link.");
    } finally {
      setIsSaving(false);
    }
  }

  const trimmed = value.trim();
  const isValid = isInstagramUrl(trimmed);
  const error =
    saveError ??
    (showError && trimmed && !isValid
      ? "Paste a link from instagram.com, like a reel or post."
      : null);

  async function paste() {
    try {
      setValue(await navigator.clipboard.readText());
      setShowError(true);
    } catch {
      // Clipboard access was refused; the field can still be pasted into by hand.
    }
  }

  function save() {
    setShowError(true);
    if (!isValid) return;
    void saveUrl(trimmed);
  }

  return (
    <Stack gap="md" pb="md">
      <Stack gap={6}>
        <TextInput
          size="md"
          label="Reel or post link"
          placeholder="https://www.instagram.com/reel/…"
          leftSection={<IconBrandInstagram size={18} color="var(--mantine-color-yellow-5)" />}
          rightSection={
            <Button size="compact-sm" variant="default" onClick={paste}>
              Paste
            </Button>
          }
          rightSectionWidth={76}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onBlur={() => setShowError(true)}
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

      <Group gap="sm" grow>
        <Button h={52} variant="default" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button h={52} onClick={save} loading={isSaving} autoContrast>
          Save link
        </Button>
      </Group>

      {currentUrl && (
        <Button
          variant="subtle"
          color="red.5"
          onClick={() => void saveUrl(null)}
          disabled={isSaving}
        >
          Remove link
        </Button>
      )}
    </Stack>
  );
}
