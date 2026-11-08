"use client";

import { ActionIcon, Menu, useMantineTheme } from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { APP_MENU_LINKS } from "./AppMenu.constants";

// The map's menu button, beside the search bar, linking to the app's other pages.
export function AppMenu() {
  const theme = useMantineTheme();

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
              backgroundColor: theme.colors.brown[7],
              border: `1px solid ${theme.colors.brown[4]}`,
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.45)",
            },
          }}
        >
          <IconMenu2 size={20} color={theme.colors.brown[0]} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {APP_MENU_LINKS.map(({ href, label, icon: Icon }) => (
          <Menu.Item
            key={href}
            component={Link}
            href={href}
            leftSection={<Icon size={20} color="var(--mantine-color-yellow-5)" />}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
