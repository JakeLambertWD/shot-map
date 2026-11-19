"use client";

import { api } from "@/app/providers";
import { ActionIcon, Menu, useMantineTheme } from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { B_ROLL_SHOTS } from "@/app/b-roll/components/BRollShots.constants";
import { APP_MENU_LINKS, type AppMenuHref } from "./AppMenu.constants";
import { CountBadge } from "./count-badge/CountBadge";

// The map's menu button, beside the search bar, linking to the app's other pages.
export function AppMenu() {
  const theme = useMantineTheme();
  const { data: upNextSpots } = api.upNext.list.useQuery();
  const { data: upcomingPosts } = api.upcomingPosts.list.useQuery();
  const { data: reelSpots } = api.reels.spots.useQuery();

  // How many things are on each page; blank until a list has loaded.
  const counts: Record<AppMenuHref, number | undefined> = {
    "/up-next": upNextSpots?.length,
    "/upcoming": upcomingPosts?.length,
    "/reels": reelSpots?.reduce((total, spot) => total + spot.reelCount, 0),
    "/b-roll": B_ROLL_SHOTS.length,
  };

  return (
    <Menu
      position="bottom-start"
      width={240}
      radius="md"
      shadow="md"
      // Bigger text, icons and tap targets than Mantine's compact default, as in the spot menu.
      styles={{
        item: { fontSize: 16, padding: "12px 14px", minHeight: 48 },
        itemSection: { marginInlineEnd: 12 },
      }}
    >
      <Menu.Target>
        <ActionIcon
          aria-label="Menu"
          size={42}
          radius="xl"
          variant="default"
          style={{ flex: "none" }}
          styles={{
            root: {
              backgroundColor: theme.colors.teal[7],
              border: `1px solid ${theme.colors.teal[4]}`,
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
            },
          }}
        >
          <IconMenu2 size={20} color={theme.colors.teal[0]} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {APP_MENU_LINKS.map(({ href, label, icon: Icon }) => (
          <Menu.Item
            key={href}
            component={Link}
            href={href}
            leftSection={<Icon size={20} color="var(--mantine-color-amber-5)" />}
            rightSection={counts[href] !== undefined && <CountBadge count={counts[href]} />}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
