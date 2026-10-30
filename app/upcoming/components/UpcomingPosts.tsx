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
import { useMemo, useState } from "react";
import { UpcomingPhotoPostCard } from "./UpcomingPhotoPostCard";
import { groupPostsByDate } from "./UpcomingPosts.constants";
import { UpcomingPostSheet } from "./UpcomingPostSheet";
import { UpcomingReelCard } from "./UpcomingReelCard";

const HEADING_COLOURS = {
  soon: "yellow.5",
  overdue: "orange.4",
  later: "brown.1",
  none: "brown.1",
} as const;

// The Upcoming page: everything captured and waiting to be posted, soonest first, with posts
// that have no date yet at the bottom.
export function UpcomingPosts() {
  const postsQuery = api.upcomingPosts.list.useQuery();
  // undefined: sheet closed; null: adding; a post: editing it.
  const [editing, setEditing] = useState<UpcomingPost | null | undefined>(undefined);
  const [openReelId, setOpenReelId] = useState<string | null>(null);

  const groups = useMemo(() => groupPostsByDate(postsQuery.data ?? []), [postsQuery.data]);

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

      {postsQuery.isPending ? (
        <Center mih="50vh">
          <Loader color="yellow" />
        </Center>
      ) : postsQuery.isError ? (
        <Text c="red.5" px="md" role="alert">
          {postsQuery.error.message}
        </Text>
      ) : groups.length === 0 ? (
        <Stack align="center" gap="sm" px="lg" pt="xl" ta="center">
          <Text c="brown.0" fw={700}>
            Nothing waiting to be posted
          </Text>
          <Text c="brown.1" fz="sm" maw={300}>
            After a shoot, add the carousel, photo or reel you&apos;re planning so it doesn&apos;t
            get forgotten.
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
        <Stack gap="lg" px="md" pt={4}>
          {groups.map((group) => (
            <Stack component="section" key={group.key} gap={8} aria-label={group.heading}>
              <Text
                component="h2"
                ff="monospace"
                fz="xs"
                c={HEADING_COLOURS[group.tone]}
                lts="0.08em"
                m={0}
              >
                {group.heading}
              </Text>
              {group.posts.map((post) =>
                post.kind === "reel" ? (
                  <UpcomingReelCard
                    key={post.id}
                    post={post}
                    expanded={openReelId === post.id}
                    onToggle={() => setOpenReelId(openReelId === post.id ? null : post.id)}
                    onEditDetails={() => setEditing(post)}
                  />
                ) : (
                  <UpcomingPhotoPostCard
                    key={post.id}
                    post={post}
                    isUndated={group.tone === "none"}
                    onOpen={() => setEditing(post)}
                  />
                ),
              )}
            </Stack>
          ))}
        </Stack>
      )}

      <UpcomingPostSheet
        opened={editing !== undefined}
        // Keep showing the latest saved version while editing.
        post={editing ? (postsQuery.data?.find((post) => post.id === editing.id) ?? editing) : null}
        onClose={() => setEditing(undefined)}
      />
    </Container>
  );
}
