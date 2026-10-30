"use client";

import { CAN_EDIT_SPOTS, type ReelKind } from "@/lib/photo-spots";
import { Box, Loader, Menu, UnstyledButton } from "@mantine/core";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { REEL_TYPE_KINDS, REEL_TYPE_STYLES } from "./Reels.constants";

type ReelTypePillProps = {
  kind: ReelKind;
  onChange: (kind: ReelKind) => void;
  isSaving?: boolean;
};

// A reel's type as a coloured pill. Tapping it opens a menu to switch between Educational,
// 1 Clip and BTS.
export function ReelTypePill({ kind, onChange, isSaving }: ReelTypePillProps) {
  const style = REEL_TYPE_STYLES[kind as keyof typeof REEL_TYPE_STYLES];
  if (!style) return null;

  const pill = (
    <UnstyledButton
      aria-label={`Reel type: ${style.label}${CAN_EDIT_SPOTS ? ", change" : ""}`}
      disabled={!CAN_EDIT_SPOTS || isSaving}
      h={26}
      pl={10}
      pr={CAN_EDIT_SPOTS ? 8 : 10}
      fz={12}
      fw={900}
      style={{
        flex: "none",
        borderRadius: 13,
        border: `1px solid ${style.color}`,
        backgroundColor: style.tint,
        color: style.text,
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: CAN_EDIT_SPOTS ? "pointer" : "default",
      }}
    >
      {style.label}
      {CAN_EDIT_SPOTS &&
        (isSaving ? (
          <Loader size={10} color={style.text} />
        ) : (
          <IconChevronDown size={12} stroke={3} aria-hidden />
        ))}
    </UnstyledButton>
  );

  if (!CAN_EDIT_SPOTS) return pill;

  return (
    <Menu position="bottom-start" width={200} radius="md" shadow="md">
      <Menu.Target>{pill}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Reel type</Menu.Label>
        {REEL_TYPE_KINDS.map((option) => {
          const optionStyle = REEL_TYPE_STYLES[option];
          const isActive = option === kind;
          return (
            <Menu.Item
              key={option}
              aria-label={isActive ? `${optionStyle.label}, current type` : optionStyle.label}
              fz={15}
              mih={44}
              fw={isActive ? 900 : 400}
              c={isActive ? optionStyle.text : undefined}
              leftSection={
                <Box
                  aria-hidden
                  w={10}
                  h={10}
                  style={{ borderRadius: "50%", backgroundColor: optionStyle.color }}
                />
              }
              rightSection={isActive ? <IconCheck size={16} stroke={3} /> : null}
              onClick={() => {
                if (!isActive) onChange(option);
              }}
            >
              {optionStyle.label}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
