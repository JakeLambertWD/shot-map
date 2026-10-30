"use client";

import { api } from "@/app/providers";
import { getSpotGearOption } from "@/lib/photo-spots";
import {
  ActionIcon,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { REEL_TYPE_KINDS } from "./reels/Reels.constants";
import { ReelsPanel } from "./reels/ReelsPanel";
import { TrialReelsGrid } from "./reels/TrialReelsGrid";
import type { SpotTabId } from "./SpotContentTabs.constants";
import { ContentTabChips } from "./ContentTabChips";
import { SpotActions } from "./SpotActions";
import { ShowcaseCarousels } from "./ShowcaseCarousels";
import { SpotPhotoTab } from "./SpotPhotoTab";
import { SpotTitle } from "./SpotTitle";

type SpotDetailProps = {
  spotId: string;
};

export function SpotDetail({ spotId }: SpotDetailProps) {
  const [activeTab, setActiveTab] = useState<SpotTabId>("showcase");

  const spotQuery = api.spots.byId.useQuery({ id: spotId }, { retry: false });

  if (spotQuery.isPending) {
    return (
      <Center mih="60vh">
        <Loader color="yellow" />
      </Center>
    );
  }

  if (spotQuery.isError) {
    return (
      <Center mih="60vh">
        <Stack align="center" gap="sm">
          <Text c="brown.0" fw={600}>
            {spotQuery.error.data?.code === "NOT_FOUND"
              ? "This spot doesn't exist."
              : "Couldn't load this spot."}
          </Text>
          <Button component={Link} href="/" variant="default">
            Back to map
          </Button>
        </Stack>
      </Center>
    );
  }

  const spot = spotQuery.data;

  const gear = getSpotGearOption(spot.gear);
  // Gear leads the weather emoji row under the photos; the status sits on the photo itself.
  const spotLabels = (
    <>
      <span role="img" aria-label={gear.label} title={gear.label}>
        {gear.emoji}
      </span>
    </>
  );

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
        <Group justify="center" wrap="nowrap" miw={0}>
          <SpotTitle title={spot.title} />
        </Group>
        <SpotActions spot={spot} />
      </Group>

      <Tabs
        value={activeTab}
        onChange={(tab) => tab && setActiveTab(tab as SpotTabId)}
        variant="pills"
      >
        <ContentTabChips spot={spot} value={activeTab} />

        <Tabs.Panel value="showcase">
          <ShowcaseCarousels spot={spot} labels={spotLabels} />
        </Tabs.Panel>

        <Tabs.Panel value="creator">
          <SpotPhotoTab
            spot={spot}
            photos={spot.creatorPhotos}
            kind="creator"
            labels={spotLabels}
          />
        </Tabs.Panel>

        {/* Educational, 1 Clip and BTS ideas together, each with a type pill. */}
        <Tabs.Panel value="reels">
          <ReelsPanel spotId={spot.id} kinds={REEL_TYPE_KINDS} />
        </Tabs.Panel>

        {/* Instagram links picked from the shared trial reel library, as a reels-style grid. */}
        <Tabs.Panel value="pov">
          <TrialReelsGrid spotId={spot.id} spotTitle={spot.title} />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
