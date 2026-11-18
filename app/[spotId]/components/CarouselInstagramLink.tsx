"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotCarousel } from "@/server/routers/spots";
import { ActionIcon, Group } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { InstagramInspoButton } from "./reels/InstagramInspoButton";
import { InstagramLinkSheet } from "./reels/InstagramLinkSheet";

type CarouselInstagramLinkProps = {
  spotId: string;
  carousel: SpotCarousel;
};

// A carousel's Instagram inspo link, as on a reel idea: the round Instagram button, plus a
// pencil for editors to change or remove a saved link.
export function CarouselInstagramLink({ spotId, carousel }: CarouselInstagramLinkProps) {
  const utils = api.useUtils();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const setInstagramUrl = api.carousels.setInstagramUrl.useMutation({
    onSuccess: () => utils.spots.byId.invalidate({ id: spotId }),
  });

  return (
    <Group gap={4} wrap="nowrap">
      {CAN_EDIT_SPOTS && carousel.instagramUrl && (
        <ActionIcon
          aria-label="Edit Instagram inspo link"
          variant="subtle"
          color="teal.1"
          size={32}
          onClick={() => setIsSheetOpen(true)}
        >
          <IconPencil size={16} />
        </ActionIcon>
      )}
      <InstagramInspoButton url={carousel.instagramUrl} onAdd={() => setIsSheetOpen(true)} />

      {CAN_EDIT_SPOTS && (
        <InstagramLinkSheet
          title={carousel.title}
          currentUrl={carousel.instagramUrl}
          opened={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSave={(instagramUrl) =>
            setInstagramUrl.mutateAsync({ spotId, carouselId: carousel.id, instagramUrl })
          }
        />
      )}
    </Group>
  );
}
