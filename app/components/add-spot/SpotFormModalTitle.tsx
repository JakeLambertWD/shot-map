"use client";

import { Button, Group, Text } from "@mantine/core";

type SpotFormModalTitleProps = {
  title: string;
  // id of the <form> the Save button submits, so the button can sit in the modal header.
  formId: string;
  isSaving: boolean;
};

// Modal header for the add and edit spot forms: the title with Save beside it at the top.
export function SpotFormModalTitle({ title, formId, isSaving }: SpotFormModalTitleProps) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Text component="span" fw={600} fz="lg">
        {title}
      </Text>
      <Button type="submit" form={formId} radius="sm" autoContrast loading={isSaving}>
        Save
      </Button>
    </Group>
  );
}

// Lets the title stretch so Save sits on the right, next to the close button.
export const SPOT_FORM_MODAL_TITLE_STYLES = { flex: 1, marginRight: "var(--mantine-spacing-sm)" };

type SpotFormStatusProps = {
  progress: string | null;
  error: string | null;
};

// Upload progress and save errors, shown at the top of the form so they're visible next to Save.
export function SpotFormStatus({ progress, error }: SpotFormStatusProps) {
  if (error) {
    return (
      <Text fz="sm" c="red.5" role="alert">
        {error}
      </Text>
    );
  }
  if (progress) {
    return (
      <Text fz="sm" c="dimmed" aria-live="polite">
        {progress}
      </Text>
    );
  }
  return null;
}
