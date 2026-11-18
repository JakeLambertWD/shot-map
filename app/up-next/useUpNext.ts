"use client";

import { api } from "@/app/providers";

// The Up next list: spots to shoot in the near future, in order.
export function useUpNext() {
  const utils = api.useUtils();
  const list = api.upNext.list.useQuery();
  const refresh = () => utils.upNext.list.invalidate();

  const add = api.upNext.add.useMutation({ onSuccess: refresh });
  const remove = api.upNext.remove.useMutation({ onSuccess: refresh });
  const reorder = api.upNext.reorder.useMutation();

  const spots = list.data ?? [];

  // Shows the new order straight away, then saves it. On failure, puts back the saved order.
  function saveOrder(spotIds: string[]) {
    utils.upNext.list.setData(undefined, (current) => {
      if (!current) return current;
      const byId = new Map(current.map((spot) => [spot.id, spot]));
      return spotIds.flatMap((id) => byId.get(id) ?? []);
    });
    reorder.mutate({ spotIds }, { onError: refresh });
  }

  return {
    list,
    spots,
    has: (spotId: string) => spots.some((spot) => spot.id === spotId),
    add: (spotId: string) => add.mutateAsync({ spotId }),
    remove: (spotId: string) => remove.mutateAsync({ spotId }),
    saveOrder,
    // The spot being added, so its row can show a loader.
    addingSpotId: add.isPending ? add.variables.spotId : null,
    removingSpotId: remove.isPending ? remove.variables.spotId : null,
  };
}
