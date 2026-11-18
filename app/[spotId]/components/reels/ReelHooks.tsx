"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS, MAX_REEL_HOOKS } from "@/lib/photo-spots";
import type { SpotReel } from "@/server/routers/reels";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";

type ReelHooksProps = {
  spotId: string;
  reel: Pick<SpotReel, "id" | "hooks">;
};

// Which hook is being edited: its index, "new" for the add field, or none.
type HookEditing = number | "new" | null;

// A reel idea's alternative hooks, under its name (the main hook). Editors tap a hook to change
// it, or remove it with its ✕.
export function ReelHooks({ spotId, reel }: ReelHooksProps) {
  const utils = api.useUtils();
  const [editing, setEditing] = useState<HookEditing>(null);
  const [draft, setDraft] = useState("");

  const setHooks = api.reels.setHooks.useMutation({
    onSuccess: async () => {
      await utils.reels.list.invalidate({ spotId });
      setEditing(null);
    },
  });

  function startEditing(hook: HookEditing) {
    setDraft(typeof hook === "number" ? reel.hooks[hook] : "");
    setEditing(hook);
  }

  function save() {
    if (editing === null || setHooks.isPending) return;
    const text = draft.trim();
    const current = editing === "new" ? "" : reel.hooks[editing];
    // Nothing typed, or nothing changed: just close the field.
    if (text === current.trim() || (!text && editing === "new")) return setEditing(null);

    const hooks =
      editing === "new"
        ? [...reel.hooks, text]
        : reel.hooks.flatMap((hook, index) => (index !== editing ? hook : text || []));
    setHooks.mutate({ id: reel.id, hooks });
  }

  function remove(index: number) {
    setHooks.mutate({ id: reel.id, hooks: reel.hooks.filter((_, i) => i !== index) });
  }

  if (reel.hooks.length === 0 && !CAN_EDIT_SPOTS) return null;

  const field = (label: string) => (
    <TextInput
      aria-label={label}
      placeholder="e.g. Nobody shoots this rooftop from here"
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") save();
        if (event.key === "Escape") setEditing(null);
      }}
      disabled={setHooks.isPending}
      error={setHooks.error?.message}
      maxLength={160}
      autoFocus
    />
  );

  return (
    <Stack gap={6} pb="sm">
      <Text ff="monospace" fz="xs" c="teal.1" tt="uppercase" lts="0.08em">
        Other hooks · {reel.hooks.length}
      </Text>

      {reel.hooks.length > 0 && (
        <Stack gap={4} component="ol" m={0} p={0} style={{ listStyle: "none" }}>
          {reel.hooks.map((hook, index) => (
            <Box component="li" key={`${index}-${hook}`}>
              {editing === index ? (
                field(`Hook ${index + 1}`)
              ) : (
                <Group gap={4} wrap="nowrap" align="flex-start">
                  <Text ff="monospace" fz="xs" c="teal.1" mt={3} w={18} style={{ flexShrink: 0 }}>
                    {index + 1}.
                  </Text>
                  <UnstyledButton
                    onClick={() => startEditing(index)}
                    disabled={!CAN_EDIT_SPOTS}
                    aria-label={CAN_EDIT_SPOTS ? `Edit hook: ${hook}` : undefined}
                    flex={1}
                    miw={0}
                  >
                    <Text fz="sm" c="teal.0">
                      {hook}
                    </Text>
                  </UnstyledButton>
                  {CAN_EDIT_SPOTS && (
                    <ActionIcon
                      aria-label={`Remove hook: ${hook}`}
                      variant="subtle"
                      color="teal.1"
                      size={24}
                      onClick={() => remove(index)}
                      disabled={setHooks.isPending}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  )}
                </Group>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {CAN_EDIT_SPOTS &&
        (editing === "new"
          ? field("New hook")
          : reel.hooks.length < MAX_REEL_HOOKS && (
              <Button
                variant="subtle"
                color="teal.1"
                size="compact-sm"
                leftSection={<IconPlus size={14} stroke={2.5} />}
                onClick={() => startEditing("new")}
                style={{ alignSelf: "flex-start" }}
              >
                Add hook
              </Button>
            ))}
    </Stack>
  );
}
