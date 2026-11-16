"use client";

import { Button, Group, NumberInput, Stack, Textarea } from "@mantine/core";
import { useState } from "react";

export type ReelClipDraft = {
  description: string;
  // Only with `withFilmingNotes`: the text shown on screen, and how to film the clip.
  onScreenText?: string | null;
  howToFilm?: string | null;
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
  // Adds the On-screen text and How to film fields, for a spot's reel ideas.
  withFilmingNotes?: boolean;
};

export function ReelClipEditor({
  clipNumber,
  initial,
  isSaving,
  error,
  onSave,
  onCancel,
  onDelete,
  withFilmingNotes,
}: ReelClipEditorProps) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [onScreenText, setOnScreenText] = useState(initial?.onScreenText ?? "");
  const [howToFilm, setHowToFilm] = useState(initial?.howToFilm ?? "");
  const [durationSeconds, setDurationSeconds] = useState<number | string>(
    initial?.durationSeconds ?? "",
  );

  function save() {
    if (!description.trim()) return;

    onSave({
      description: description.trim(),
      ...(withFilmingNotes && {
        onScreenText: onScreenText.trim() || null,
        howToFilm: howToFilm.trim() || null,
      }),
      durationSeconds: typeof durationSeconds === "number" ? durationSeconds : null,
    });
  }

  return (
    <Stack gap="xs" py="sm">
      <Textarea
        label={withFilmingNotes ? "What happens" : undefined}
        aria-label={withFilmingNotes ? undefined : `Describe clip ${clipNumber}`}
        placeholder={
          withFilmingNotes
            ? "What the camera sees"
            : "What the camera sees, plus any on-screen text"
        }
        value={description}
        onChange={(event) => setDescription(event.currentTarget.value)}
        autosize
        minRows={2}
        maxLength={1000}
        error={error}
        autoFocus
      />
      {withFilmingNotes && (
        <>
          <Textarea
            label="On-screen text (optional)"
            placeholder="e.g. I waited 20 minutes for this"
            value={onScreenText}
            onChange={(event) => setOnScreenText(event.currentTarget.value)}
            autosize
            minRows={1}
            maxLength={1000}
          />
          <Textarea
            label="How to film (optional)"
            placeholder="e.g. Low angle, slow push in, 24mm"
            value={howToFilm}
            onChange={(event) => setHowToFilm(event.currentTarget.value)}
            autosize
            minRows={1}
            maxLength={1000}
          />
        </>
      )}
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
