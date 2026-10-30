"use client";

import { Button, Group, NumberInput, Stack, Textarea } from "@mantine/core";
import { useState } from "react";

export type ReelClipDraft = {
  description: string;
  durationSeconds: number | null;
};

type ReelClipEditorProps = {
  clipNumber: number;
  initial?: ReelClipDraft;
  isSaving: boolean;
  error?: string | null;
  onSave: (draft: ReelClipDraft) => void;
  onCancel: () => void;
  // Only for existing clips.
  onDelete?: () => void;
};

export function ReelClipEditor({
  clipNumber,
  initial,
  isSaving,
  error,
  onSave,
  onCancel,
  onDelete,
}: ReelClipEditorProps) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationSeconds, setDurationSeconds] = useState<number | string>(
    initial?.durationSeconds ?? "",
  );

  function save() {
    if (!description.trim()) return;

    onSave({
      description: description.trim(),
      durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
    });
  }

  return (
    <Stack gap="xs" py="sm">
      <Textarea
        aria-label={`Describe clip ${clipNumber}`}
        placeholder="What the camera sees, plus any on-screen text"
        value={description}
        onChange={(event) => setDescription(event.currentTarget.value)}
        autosize
        minRows={2}
        maxLength={1000}
        error={error}
        autoFocus
      />
      <Group gap="xs" wrap="nowrap">
        <NumberInput
          aria-label={`Length of clip ${clipNumber} in seconds`}
          placeholder="Secs"
          suffix="s"
          value={durationSeconds}
          onChange={setDurationSeconds}
          min={1}
          max={600}
          allowDecimal={false}
          w={96}
        />
        {onDelete && (
          <Button variant="subtle" color="red.5" onClick={onDelete} disabled={isSaving} px="xs">
            Delete
          </Button>
        )}
        <Button variant="default" onClick={onCancel} disabled={isSaving} ml="auto">
          Cancel
        </Button>
        <Button onClick={save} loading={isSaving} disabled={!description.trim()} autoContrast>
          Save
        </Button>
      </Group>
    </Stack>
  );
}
