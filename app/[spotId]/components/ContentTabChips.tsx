"use client";

import { api } from "@/app/providers";
import { TabChips } from "@/app/components/tab-chips/TabChips";
import type { SpotDetail } from "@/server/routers/spots";
import { REEL_TYPE_KINDS } from "./reels/Reels.constants";
import { SPOT_TABS, type SpotTabId } from "./SpotContentTabs.constants";

type ContentTabChipsProps = {
  spot: SpotDetail;
  value: SpotTabId;
};

// The content tabs as a row of chips under the spot name.
export function ContentTabChips({ spot, value }: ContentTabChipsProps) {
  // How many ideas each reel tab has; the same queries the tab panels use, so they're shared.
  const reelsQuery = api.reels.list.useQuery({ spotId: spot.id, kinds: [...REEL_TYPE_KINDS] });
  const trialReelsQuery = api.trialReels.list.useQuery({ spotId: spot.id });

  // Showcase has its own photo counter, so it doesn't get a count here.
  const counts: Partial<Record<SpotTabId, number>> = {
    creator: spot.creatorPhotos.length,
    reels: reelsQuery.data?.length ?? 0,
    pov: trialReelsQuery.data?.length ?? 0,
  };

  return (
    <TabChips
      tabs={SPOT_TABS.map((tab) => ({ ...tab, count: counts[tab.id] }))}
      value={value}
      ariaLabel="Spot content"
    />
  );
}
