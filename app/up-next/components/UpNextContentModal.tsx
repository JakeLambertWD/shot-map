"use client";

import type { UpNextContent } from "@/lib/photo-spots";
import { Modal } from "@mantine/core";
import { UpNextContentChoice } from "./UpNextContentChoice";

type UpNextContentModalProps = {
  opened: boolean;
  onClose: () => void;
  spotTitle: string;
  // Adds the spot with the choice. The caller closes the modal once it's added.
  onPick: (content: UpNextContent) => Promise<void>;
};

// Asks what a spot is being shot for as it's added to Up next from the spot's own menu.
export function UpNextContentModal({
  opened,
  onClose,
  spotTitle,
  onPick,
}: UpNextContentModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Add to Up next" centered>
      <UpNextContentChoice spotTitle={spotTitle} onPick={onPick} />
    </Modal>
  );
}
