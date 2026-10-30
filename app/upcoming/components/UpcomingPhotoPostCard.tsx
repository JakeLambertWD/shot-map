"use client";

import { REEL_CARD_BORDER } from "@/app/[spotId]/components/reels/Reels.constants";
import type { UpcomingPost } from "@/server/routers/upcomingPosts";
import { Box, Center, Group, Image, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconPhoto, IconPlayerPlayFilled } from "@tabler/icons-react";
import { formatPhotoPostSummary } from "./UpcomingPosts.constants";

// A carousel or single-photo post: its photos in a row, then the title and what's in it.
// Tapping it opens the post's details to edit.
export function UpcomingPhotoPostCard({
  post,
  isUndated,
  onOpen,
}: {
  post: UpcomingPost;
  isUndated: boolean;
  onOpen: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onOpen}
      aria-label={`${post.title}, ${formatPhotoPostSummary(post)}. Edit`}
      bg="brown.6"
      p="sm"
      w="100%"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: isUndated ? "1px dashed var(--mantine-color-brown-3)" : REEL_CARD_BORDER,
      }}
    >
      <Stack gap="sm">
        <Group
          gap={6}
          wrap="nowrap"
          aria-hidden
          style={{ overflowX: "auto", scrollbarWidth: "none" }}
        >
          {post.media.length === 0 ? (
            <Center w={100} h={125} bg="brown.5" style={{ borderRadius: 6, flex: "none" }}>
              <IconPhoto size={24} color="var(--mantine-color-brown-2)" />
            </Center>
          ) : (
            post.media.map((media) => (
              <Box
                key={media.id}
                pos="relative"
                w={100}
                h={125}
                bg="brown.5"
                style={{ borderRadius: 6, overflow: "hidden", flex: "none" }}
              >
                {media.mediaType === "video" ? (
                  <>
                    <video
                      src={`${media.mediaUrl}#t=0.1`}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Center pos="absolute" inset={0}>
                      <IconPlayerPlayFilled size={18} color="var(--mantine-color-brown-0)" />
                    </Center>
                  </>
                ) : (
                  <Image src={media.mediaUrl} alt="" w="100%" h="100%" fit="cover" />
                )}
              </Box>
            ))
          )}
        </Group>
        <Group justify="space-between" align="flex-end" wrap="nowrap" gap="xs">
          <Stack gap={4} miw={0}>
            <Text ff="heading" fz={15} fw={600} lh={1.3} c="brown.0">
              {post.title}
            </Text>
            <Text fz="xs" c="brown.1">
              {formatPhotoPostSummary(post)}
            </Text>
          </Stack>
          {isUndated && (
            <Text fz={13} fw={700} c="yellow.5" style={{ whiteSpace: "nowrap" }}>
              Set a date
            </Text>
          )}
        </Group>
      </Stack>
    </UnstyledButton>
  );
}
