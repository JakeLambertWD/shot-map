"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import { Stack, Text, Textarea, UnstyledButton } from "@mantine/core";
import { useState } from "react";

type EditingNotesProps = {
  spotId: string;
  notes: string | null;
};

// Editing tutorial notes for a spot: tap to edit, saved when the field loses focus.
export function EditingNotes({ spotId, notes }: EditingNotesProps) {
  const utils = api.useUtils();
  const [draft, setDraft] = useState<string | null>(null);

  const updateNotes = api.spots.updateEditingNotes.useMutation({
    onSuccess: async () => {
      await utils.spots.byId.invalidate({ id: spotId });
      setDraft(null);
    },
  });

  if (!notes && !CAN_EDIT_SPOTS) return null;

  function save() {
    if (draft === null || updateNotes.isPending) return;

    if (draft.trim() === (notes ?? "")) {
      setDraft(null);
      return;
    }

    updateNotes.mutate({ spotId, notes: draft });
  }

  const text = (
    <Text c={notes ? "brown.0" : "brown.1"} style={{ whiteSpace: "pre-line" }}>
      {notes ?? "Add Lightroom settings or edit steps…"}
    </Text>
  );

  return (
    <Stack gap="xs" component="section">
      <Text component="h2" ff="monospace" fz="xs" c="brown.1" tt="uppercase" lts="0.08em">
        Editing notes
      </Text>

      {!CAN_EDIT_SPOTS ? (
        text
      ) : draft === null ? (
        <UnstyledButton
          aria-label="Edit editing notes"
          onClick={() => setDraft(notes ?? "")}
          w="100%"
          ta="left"
        >
          {text}
        </UnstyledButton>
      ) : (
        <Textarea
          variant="unstyled"
          aria-label="Editing notes"
          styles={{ input: { padding: 0, minHeight: 0, color: "var(--mantine-color-brown-0)" } }}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Escape") setDraft(null);
          }}
          error={updateNotes.error?.message}
          readOnly={updateNotes.isPending}
          autosize
          minRows={2}
          maxLength={4000}
          autoFocus
        />
      )}
    </Stack>
  );
}
