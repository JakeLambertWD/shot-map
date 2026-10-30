"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { UpcomingPost } from "@/server/routers/upcomingPosts";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { UpcomingPhotoPostCard } from "./UpcomingPhotoPostCard";
import { UpcomingPostSheet } from "./UpcomingPostSheet";
import { UpcomingReelCard } from "./UpcomingReelCard";

// The Upcoming page: everything captured and waiting to be posted, newest first.
export function UpcomingPosts() {
  const { data: posts, isPending, isError, error } = api.upcomingPosts.list.useQuery();
  // undefined: sheet closed; null: adding; a post: editing it.
  const [editing, setEditing] = useState<UpcomingPost | null | undefined>(undefined);
  const [openReelId, setOpenReelId] = useState<string | null>(null);

  return (
    <Container size="30rem" px={0} pb="xxl" w="100%">
      <Group justify="space-between" wrap="nowrap" px="xs" my="sm">
        <ActionIcon
          component={Link}
          href="/"
          aria-label="Back to map"
          variant="subtle"
          color="brown.0"
          size={44}
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <Title order={1} fz="lg" c="brown.0">
          Upcoming
        </Title>
        {CAN_EDIT_SPOTS ? (
          <ActionIcon
            aria-label="Add an upcoming post"
            onClick={() => setEditing(null)}
            size={44}
            variant="transparent"
          >
            <Center w={32} h={32} bg="yellow.5" style={{ borderRadius: 16 }}>
              <IconPlus size={18} stroke={2.8} color="var(--mantine-color-brown-9)" />
            </Center>
          </ActionIcon>
        ) : (
          <Box w={44} />
        )}
      </Group>

      {isPending ? (
        <Center mih="50vh">
          <Loader color="yellow" />
        </Center>
      ) : isError ? (
        <Text c="red.5" px="md" role="alert">
          {error.message}
        </Text>
      ) : posts.length === 0 ? (
        <Stack align="center" gap="sm" px="lg" pt="xl" ta="center">
          <Text c="brown.0" fw={700}>
            Nothing waiting to be posted
          </Text>
          <Text c="brown.1" fz="sm" maw={300}>
            After a shoot, add the carousel or reel you&apos;re planning so it doesn&apos;t get
            forgotten.
          </Text>
          {CAN_EDIT_SPOTS && (
            <Button
              mt="xs"
              h={48}
              radius="sm"
              autoContrast
              leftSection={<IconPlus size={18} />}
              onClick={() => setEditing(null)}
            >
              Add an upcoming post
            </Button>
          )}
        </Stack>
      ) : (
        <Stack gap={8} px="md" pt={4}>
          {posts.map((post) =>
            post.kind === "reel" ? (
              <UpcomingReelCard
                key={post.id}
                post={post}
                expanded={openReelId === post.id}
                onToggle={() => setOpenReelId(openReelId === post.id ? null : post.id)}
                onEditDetails={() => setEditing(post)}
              />
            ) : (
              <UpcomingPhotoPostCard key={post.id} post={post} onOpen={() => setEditing(post)} />
            ),
          )}
        </Stack>
      )}

      <UpcomingPostSheet
        opened={editing !== undefined}
        // Keep showing the latest saved version while editing.
        post={editing ? (posts?.find((post) => post.id === editing.id) ?? editing) : null}
        onClose={() => setEditing(undefined)}
      />
    </Container>
  );
}
