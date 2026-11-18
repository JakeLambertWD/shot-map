"use client";

import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import { ActionIcon } from "@mantine/core";
import { IconBrandInstagram } from "@tabler/icons-react";

type InstagramInspoButtonProps = {
  url: string | null;
  // Opens the sheet for adding a link, when there isn't one yet.
  onAdd: () => void;
};

// A round Instagram button: opens the inspo link when there is one, or, for editors, a dashed
// outline that adds one. Used by reel ideas and carousels.
export function InstagramInspoButton({ url, onAdd }: InstagramInspoButtonProps) {
  if (url) {
    return (
      <ActionIcon
        component="a"
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label="Open Instagram inspo"
        variant="default"
        radius="xl"
        size={32}
        bg="teal.5"
      >
        <IconBrandInstagram size={17} color="var(--mantine-color-amber-5)" />
      </ActionIcon>
    );
  }

  if (!CAN_EDIT_SPOTS) return null;

  return (
    <ActionIcon
      aria-label="Add Instagram inspo link"
      variant="transparent"
      radius="xl"
      size={32}
      onClick={onAdd}
      style={{ border: "1.5px dashed var(--mantine-color-teal-2)" }}
    >
      <IconBrandInstagram size={17} color="var(--mantine-color-teal-2)" />
    </ActionIcon>
  );
}
