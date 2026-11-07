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
  Tabs,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { UpcomingPhotoPostCard } from "./UpcomingPhotoPostCard";
import { UpcomingPostSheet } from "./UpcomingPostSheet";
import { getUpcomingTabId, UPCOMING_TABS, type UpcomingTabId } from "./UpcomingPosts.constants";
import { UpcomingReelCard } from "./UpcomingReelCard";

// The Upcoming page: everything captured and waiting to be posted, newest first, split into
// Carousels and Reels tabs.
export function UpcomingPosts() {
  const theme = useMantineTheme();
  const { data: posts, isPending, isError, error } = api.upcomingPosts.list.useQuery();
  const [activeTab, setActiveTab] = useState<UpcomingTabId>("carousel");
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
      ) : (
        <Tabs
          value={activeTab}
          onChange={(tab) => tab && setActiveTab(tab as UpcomingTabId)}
          variant="pills"
        >
          <Tabs.List aria-label="Post type" px="md" pb="sm" style={{ gap: 8 }}>
            {UPCOMING_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const count = posts.filter((post) => getUpcomingTabId(post.kind) === tab.id).length;
              return (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  rightSection={
                    count > 0 ? (
                      <Center
                        component="span"
                        miw={18}
                        h={18}
                        px={5}
                        fz={11}
                        fw={900}
                        bg={isActive ? "rgba(0, 0, 0, 0.18)" : "brown.4"}
                        style={{ borderRadius: 9, boxSizing: "border-box" }}
                      >
                        {count}
                      </Center>
                    ) : null
                  }
                  styles={{
                    tab: {
                      height: 36,
                      padding: "0 14px",
                      borderRadius: 18,
                      border: isActive ? "none" : `1px solid ${theme.colors.brown[4]}`,
                      backgroundColor: isActive ? theme.colors.yellow[5] : theme.colors.brown[6],
                      color: isActive ? theme.colors.brown[9] : theme.colors.brown[0],
                      fontSize: 13,
                      fontWeight: isActive ? 900 : 700,
                    },
                    tabSection: { marginInlineStart: 6 },
                  }}
                >
                  {tab.label}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>

          {UPCOMING_TABS.map((tab) => {
            const tabPosts = posts.filter((post) => getUpcomingTabId(post.kind) === tab.id);
            return (
              <Tabs.Panel key={tab.id} value={tab.id}>
                {tabPosts.length === 0 ? (
                  <Stack align="center" gap="sm" px="lg" pt="xl" ta="center">
                    <Text c="brown.0" fw={700}>
                      {tab.emptyTitle}
                    </Text>
                    <Text c="brown.1" fz="sm" maw={300}>
                      After a shoot, add the {tab.id} you&apos;re planning so it doesn&apos;t get
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
                        {tab.addLabel}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Stack gap={8} px="md" pt={4}>
                    {tabPosts.map((post, index) =>
                      post.kind === "reel" ? (
                        <UpcomingReelCard
                          key={post.id}
                          post={post}
                          number={index + 1}
                          expanded={openReelId === post.id}
                          onToggle={() => setOpenReelId(openReelId === post.id ? null : post.id)}
                          onEditDetails={() => setEditing(post)}
                        />
                      ) : (
                        <UpcomingPhotoPostCard
                          key={post.id}
                          post={post}
                          number={index + 1}
                          onOpen={() => setEditing(post)}
                        />
                      ),
                    )}
                  </Stack>
                )}
              </Tabs.Panel>
            );
          })}
        </Tabs>
      )}

      <UpcomingPostSheet
        opened={editing !== undefined}
        // Keep showing the latest saved version while editing.
        post={editing ? (posts?.find((post) => post.id === editing.id) ?? editing) : null}
        defaultKind={activeTab}
        onClose={() => setEditing(undefined)}
      />
    </Container>
  );
}
