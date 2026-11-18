import { Box, Center, Image } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";
import { SPOT_THUMBNAIL_SIZE } from "./SortableSpots.constants";

// A spot's cover photo as a small square, or a photo icon when it has none.
export function SpotThumbnail({ coverImageUrl }: { coverImageUrl: string | null }) {
  return (
    <Box
      w={SPOT_THUMBNAIL_SIZE}
      h={SPOT_THUMBNAIL_SIZE}
      bdrs="sm"
      bg="teal.4"
      style={{ flexShrink: 0, overflow: "hidden" }}
    >
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt=""
          w={SPOT_THUMBNAIL_SIZE}
          h={SPOT_THUMBNAIL_SIZE}
          fit="cover"
        />
      ) : (
        <Center h="100%">
          <IconPhoto size={22} color="var(--mantine-color-teal-2)" />
        </Center>
      )}
    </Box>
  );
}
