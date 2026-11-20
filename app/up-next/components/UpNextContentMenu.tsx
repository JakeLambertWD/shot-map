"use client";

import { CAN_EDIT_SPOTS, type UpNextContent } from "@/lib/photo-spots";
import { Group, Menu, UnstyledButton } from "@mantine/core";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { getUpNextContentOption, UP_NEXT_CONTENT_OPTIONS } from "./UpNext.constants";

type UpNextContentMenuProps = {
  className?: string;
  spotTitle: string;
  content: UpNextContent;
  onChange: (content: UpNextContent) => void;
};

// What an Up next spot is being shot for, as icons in an outlined button: a camera for a
// carousel, a video camera for a reel, or both. Tapping it opens a menu to switch.
export function UpNextContentMenu({
  className,
  spotTitle,
  content,
  onChange,
}: UpNextContentMenuProps) {
  const current = getUpNextContentOption(content);

  const button = (
    <UnstyledButton
      className={className}
      aria-label={`${spotTitle} is for: ${current.label}${CAN_EDIT_SPOTS ? ", change" : ""}`}
      disabled={!CAN_EDIT_SPOTS}
      h={24}
      px={8}
      bdrs="sm"
      c="amber.5"
      style={{
        flexShrink: 0,
        border: "1px solid var(--mantine-color-teal-4)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: CAN_EDIT_SPOTS ? "pointer" : "default",
      }}
    >
      <Group gap={6} wrap="nowrap" aria-hidden>
        {current.icons.map((Icon, index) => (
          <Icon key={index} size={14} stroke={1.75} />
        ))}
      </Group>
      {CAN_EDIT_SPOTS && (
        <IconChevronDown size={12} stroke={2} color="var(--mantine-color-teal-1)" aria-hidden />
      )}
    </UnstyledButton>
  );

  if (!CAN_EDIT_SPOTS) return button;

  return (
    <Menu position="bottom-start" width={200} radius="md" shadow="md">
      <Menu.Target>{button}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Shooting for</Menu.Label>
        {UP_NEXT_CONTENT_OPTIONS.map((option) => {
          const isActive = option.value === content;
          return (
            <Menu.Item
              key={option.value}
              aria-label={isActive ? `${option.label}, current` : option.label}
              fz={15}
              mih={44}
              fw={isActive ? 700 : 400}
              leftSection={
                <Group gap={6} wrap="nowrap" c="amber.5" aria-hidden>
                  {option.icons.map((Icon, index) => (
                    <Icon key={index} size={16} stroke={1.75} />
                  ))}
                </Group>
              }
              rightSection={isActive ? <IconCheck size={16} stroke={3} /> : null}
              onClick={() => {
                if (!isActive) onChange(option.value);
              }}
            >
              {option.label}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
