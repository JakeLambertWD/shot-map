import type { UpcomingPostMedia } from "@/server/routers/upcomingPosts";
import { Center, Image, UnstyledButton } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";

type UpcomingMediaThumbnailProps = {
  media: UpcomingPostMedia;
  index: number;
  w: number;
  h: number;
  onClick: () => void;
};

// A photo's small copy, or a video's poster frame, in a card's row of thumbnails. Only small
// images load here, lazily; the full photo or video only loads once it's opened full screen.
export function UpcomingMediaThumbnail({
  media,
  index,
  w,
  h,
  onClick,
}: UpcomingMediaThumbnailProps) {
  const isVideo = media.mediaType === "video";
  const src = isVideo ? media.posterUrl : (media.thumbnailUrl ?? media.mediaUrl);

  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={`View ${isVideo ? "video" : "photo"} ${index + 1} full screen`}
      pos="relative"
      w={w}
      h={h}
      bg="brown.5"
      style={{ borderRadius: 6, overflow: "hidden", flex: "none" }}
    >
      {src && <Image src={src} alt="" loading="lazy" w="100%" h="100%" fit="cover" />}
      {isVideo && (
        <Center pos="absolute" inset={0} aria-hidden>
          <IconPlayerPlayFilled size={18} color="var(--mantine-color-brown-0)" />
        </Center>
      )}
    </UnstyledButton>
  );
}
