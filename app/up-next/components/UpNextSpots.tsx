"use client";

import { TabChips } from "@/app/components/tab-chips/TabChips";
import { UpcomingPostList } from "@/app/upcoming/components/UpcomingPostList";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
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
} from "@mantine/core";
import { IconChevronLeft, IconListNumbers, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { useUpNext } from "../useUpNext";
import { AddUpNextSpotsModal } from "./AddUpNextSpotsModal";
import { isInUpNextTab, UP_NEXT_TABS, type UpNextTab } from "./UpNext.constants";
import { UpNextSpotCard } from "./UpNextSpotCard";

// The Up next page: spots to shoot in the near future, as cards like the Posts page. Spots are
// added from here or from a spot's menu, join the top of the list, and can be dragged into the
// order they'll be shot. The tabs narrow the list to spots shot for a carousel or a reel.
export function UpNextSpots() {
  const upNext = useUpNext();
  const { isPending, isError, error } = upNext.list;
  const { spots } = upNext;
  const [activeTab, setActiveTab] = useState<UpNextTab>("all");
  const [isAdding, setIsAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function remove(spotId: string) {
    setRemoveError(null);
    try {
      await upNext.remove(spotId);
    } catch (removeFailure) {
      setRemoveError(
        removeFailure instanceof Error ? removeFailure.message : "Couldn't remove that spot.",
      );
    }
  }

  const tabs = UP_NEXT_TABS.map((tab) => ({
    ...tab,
    count: spots.filter((spot) => isInUpNextTab(spot.content, tab.id)).length,
  }));

  return (
    <Container size="30rem" px={0} pb="xxl" w="100%">
      <Group justify="space-between" wrap="nowrap" px="xs" my="sm">
        <ActionIcon
          component={Link}
          href="/"
          aria-label="Back to map"
          variant="subtle"
          color="teal.0"
          size={44}
        >
          <IconChevronLeft size={24} />
        </ActionIcon>
        <Title order={1} fz="lg" c="teal.0">
          Up next
        </Title>
        {CAN_EDIT_SPOTS ? (
          <ActionIcon
            aria-label="Add spots to Up next"
            onClick={() => setIsAdding(true)}
            size={44}
            variant="transparent"
          >
            <Center w={32} h={32} bg="amber.5" style={{ borderRadius: 16 }}>
              <IconPlus size={18} stroke={2.8} color="var(--mantine-color-teal-9)" />
            </Center>
          </ActionIcon>
        ) : (
          <Box w={44} />
        )}
      </Group>

      {isPending ? (
        <Center mih="50vh">
          <Loader color="amber" />
        </Center>
      ) : isError ? (
        <Text c="red.5" px="md" role="alert">
          {error.message}
        </Text>
      ) : spots.length === 0 ? (
        <Stack mih="60vh" align="center" justify="center" gap="sm" px="xl" ta="center">
          <IconListNumbers size={40} stroke={1.5} color="var(--mantine-color-teal-2)" />
          <Text fw={700} c="teal.0">
            Nothing up next yet
          </Text>
          <Text fz="sm" c="teal.1">
            Add the spots you want to shoot soon, then drag them into order.
          </Text>
          {CAN_EDIT_SPOTS && (
            <Button
              mt="xs"
              h={48}
              radius="sm"
              leftSection={<IconPlus size={18} />}
              onClick={() => setIsAdding(true)}
              autoContrast
            >
              Add spots
            </Button>
          )}
        </Stack>
      ) : (
        <Tabs
          value={activeTab}
          onChange={(tab) => tab && setActiveTab(tab as UpNextTab)}
          variant="pills"
        >
          <TabChips tabs={tabs} value={activeTab} ariaLabel="Show spots for" />

          {removeError && (
            <Text fz="sm" c="red.5" px="md" pb="sm" role="alert">
              {removeError}
            </Text>
          )}

          {UP_NEXT_TABS.map((tab) => {
            const tabSpots = spots.filter((spot) => isInUpNextTab(spot.content, tab.id));
            return (
              <Tabs.Panel key={tab.id} value={tab.id}>
                {tabSpots.length === 0 ? (
                  <Center px="lg" pt="xl" fz="sm" c="teal.1" ta="center">
                    No spots up next for {tab.label.toLowerCase()} yet
                  </Center>
                ) : (
                  <Box px="md" pt={4}>
                    <UpcomingPostList
                      posts={tabSpots}
                      // Only the full list can be reordered, so a narrowed list never saves a
                      // partial order.
                      canReorder={CAN_EDIT_SPOTS && tab.id === "all"}
                      onReorder={upNext.saveOrder}
                      renderPost={(spot, number, dragHandle) => (
                        <UpNextSpotCard
                          spot={spot}
                          number={number}
                          dragHandle={dragHandle}
                          onContentChange={(content) => upNext.saveContent(spot.id, content)}
                          onRemove={() => remove(spot.id)}
                          isRemoving={upNext.removingSpotId === spot.id}
                        />
                      )}
                    />
                  </Box>
                )}
              </Tabs.Panel>
            );
          })}
        </Tabs>
      )}

      {CAN_EDIT_SPOTS && (
        <AddUpNextSpotsModal
          opened={isAdding}
          onClose={() => setIsAdding(false)}
          upNextSpotIds={spots.map((spot) => spot.id)}
          onAdd={async (spotId, content) => {
            await upNext.add(spotId, content);
          }}
        />
      )}
    </Container>
  );
}
