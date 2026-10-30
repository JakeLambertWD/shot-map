"use client";

import { getSpotStatusLabel, type SpotStatus } from "@/lib/photo-spots";
import { Center, Tooltip, useMantineTheme } from "@mantine/core";
import { IconCheck, IconPencil } from "@tabler/icons-react";

// A spot's status as a small round icon: a pencil while planning, a yellow tick once ready.
// Built to sit on top of a photo, so the planning icon has a dark backing to stay visible.
export function SpotStatusIcon({
  status,
  size = 28,
  withTooltip = true,
}: {
  status: SpotStatus;
  size?: number;
  // Off when the icon sits inside another control, like the tappable photo.
  withTooltip?: boolean;
}) {
  const theme = useMantineTheme();
  const label = getSpotStatusLabel(status);
  const isReady = status === "ready_to_shoot";

  const icon = (
    <Center
      role="img"
      aria-label={label}
      title={label}
      tabIndex={withTooltip ? 0 : undefined}
      w={size}
      h={size}
      style={{
        flex: "none",
        borderRadius: "50%",
        boxSizing: "border-box",
        backgroundColor: isReady ? theme.colors.yellow[5] : "rgba(0, 0, 0, 0.6)",
        border: isReady ? "none" : `1.5px solid ${theme.colors.brown[1]}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
      }}
    >
      {isReady ? (
        <IconCheck size={size * 0.55} stroke={3} color={theme.colors.brown[9]} aria-hidden />
      ) : (
        <IconPencil size={size * 0.5} stroke={2.2} color={theme.colors.brown[0]} aria-hidden />
      )}
    </Center>
  );

  if (!withTooltip) return icon;

  return (
    <Tooltip label={label} events={{ hover: true, focus: true, touch: true }}>
      {icon}
    </Tooltip>
  );
}
