"use client";

import { api } from "@/app/providers";
import { getTodayShootDate } from "@/lib/photo-spots";
import { useMounted } from "@mantine/hooks";
import { useState } from "react";

// Today's shoot for the viewer's own day. The date is only known in the browser, so the list
// loads once the page is mounted.
export function useTodayShoot() {
  const isMounted = useMounted();
  const [date] = useState(getTodayShootDate);
  const utils = api.useUtils();

  const list = api.shoot.list.useQuery({ date }, { enabled: isMounted });
  const refresh = () => utils.shoot.list.invalidate();

  const add = api.shoot.add.useMutation({ onSuccess: refresh });
  const remove = api.shoot.remove.useMutation({ onSuccess: refresh });
  const setShot = api.shoot.setShot.useMutation({ onSuccess: refresh });

  const spots = list.data ?? [];

  return {
    date,
    isReady: isMounted && !list.isPending,
    list,
    spots,
    has: (spotId: string) => spots.some((spot) => spot.spotId === spotId),
    indexOf: (spotId: string) => spots.findIndex((spot) => spot.spotId === spotId),
    add: (spotId: string) => add.mutateAsync({ date, spotId }),
    remove: (spotId: string) => remove.mutateAsync({ date, spotId }),
    setShot: (spotId: string, shot: boolean) => setShot.mutateAsync({ date, spotId, shot }),
    isSaving: add.isPending || remove.isPending || setShot.isPending,
  };
}
