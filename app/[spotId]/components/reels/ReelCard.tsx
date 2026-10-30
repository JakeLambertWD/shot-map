"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import type { SpotReel } from "@/server/routers/reels";
import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconBrandInstagram, IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { formatReelSummary, REEL_CARD_BORDER } from "./Reels.constants";
import { InstagramLinkSheet } from "./InstagramLinkSheet";
import { ReelClipEditor, type ReelClipDraft } from "./ReelClipEditor";
import { ReelClipRow } from "./ReelClipRow";
import { ReelTypePill } from "./ReelTypePill";

type ReelCardProps = {
  spotId: string;
  reel: SpotReel;
  expanded: boolean;
  onToggle: () => void;
  // On the combined Reels tab: show the reel's type as a pill that can be changed.
  showType?: boolean;
};

// Which clip is being edited: an existing clip's id, "new" for the add form, or none.
type ClipEditing = string | "new" | null;

export function ReelCard({ spotId, reel, expanded, onToggle, showType }: ReelCardProps) {
  const utils = api.useUtils();
  const [clipEditing, setClipEditing] = useState<ClipEditing>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);

  const refresh = () => utils.reels.list.invalidate({ spotId });
  const closeEditor = { onSuccess: async () => (await refresh(), setClipEditing(null)) };

  const addClip = api.reels.addClip.useMutation(closeEditor);
  const updateClip = api.reels.updateClip.useMutation(closeEditor);
  const deleteClip = api.reels.deleteClip.useMutation(closeEditor);
  const rename = api.reels.rename.useMutation({
    onSuccess: async () => (await refresh(), setTitleDraft(null)),
  });
  const deleteReel = api.reels.delete.useMutation({ onSuccess: refresh });
  const setKind = api.reels.setKind.useMutation({ onSuccess: refresh });

  const isSavingClip = addClip.isPending || updateClip.isPending || deleteClip.isPending;
  const clipError =
    addClip.error?.message ?? updateClip.error?.message ?? deleteClip.error?.message;

  function saveClip(draft: ReelClipDraft) {
    if (clipEditing === "new") addClip.mutate({ reelId: reel.id, ...draft });
    else if (clipEditing) updateClip.mutate({ id: clipEditing, ...draft });
  }

  function saveTitle() {
    if (titleDraft === null) return;
    if (!titleDraft.trim() || titleDraft.trim() === reel.title) return setTitleDraft(null);
    rename.mutate({ id: reel.id, title: titleDraft });
  }

  function confirmDeleteReel() {
    if (window.confirm(`Delete “${reel.title}” and its clips?`)) deleteReel.mutate({ id: reel.id });
  }

  return (
    <Paper bg="brown.6" radius="md" style={{ border: REEL_CARD_BORDER }}>
      <Group gap="xs" wrap="nowrap" align="flex-start" p="sm" pr="xs">
        {titleDraft !== null ? (
          <TextInput
            flex={1}
            aria-label="Reel name"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.currentTarget.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveTitle();
              if (event.key === "Escape") setTitleDraft(null);
            }}
            maxLength={160}
            error={rename.error?.message}
            autoFocus
          />
        ) : (
          <Stack gap={6} flex={1} miw={0}>
            <UnstyledButton onClick={onToggle} aria-expanded={expanded}>
              <Stack gap={4}>
                <Title order={3} fz={expanded ? 16 : 15} lh={1.3} c="brown.0">
                  {reel.title}
                </Title>
                {!showType && (
                  <Text fz="xs" c="brown.1">
                    {formatReelSummary(reel.clips)}
                  </Text>
                )}
              </Stack>
            </UnstyledButton>
            {/* The pill is its own button, so it sits outside the expand/collapse button. */}
            {showType && (
              <Group gap={8} wrap="nowrap">
                <ReelTypePill
                  kind={reel.kind}
                  isSaving={setKind.isPending}
                  onChange={(kind) => setKind.mutate({ id: reel.id, kind })}
                />
                <Text fz="xs" c="brown.1" truncate>
                  {formatReelSummary(reel.clips)}
                </Text>
              </Group>
            )}
          </Stack>
        )}

        {reel.instagramUrl ? (
          <ActionIcon
            component="a"
            href={reel.instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Instagram inspo"
            variant="default"
            radius="xl"
            size={32}
            bg="brown.5"
          >
            <IconBrandInstagram size={17} color="var(--mantine-color-yellow-5)" />
          </ActionIcon>
        ) : (
          CAN_EDIT_SPOTS && (
            <ActionIcon
              aria-label="Add Instagram inspo link"
              variant="transparent"
              radius="xl"
              size={32}
              onClick={() => setLinkSheetOpen(true)}
              style={{ border: "1.5px dashed var(--mantine-color-brown-2)" }}
            >
              <IconBrandInstagram size={17} color="var(--mantine-color-brown-2)" />
            </ActionIcon>
          )
        )}

        <ActionIcon
          aria-label={expanded ? "Collapse reel" : "Expand reel"}
          variant="transparent"
          color="brown.1"
          size={32}
          onClick={onToggle}
        >
          {expanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </ActionIcon>
      </Group>

      <Collapse expanded={expanded}>
        <Box px="sm" pb="sm">
          <Box component="ol" m={0} p={0} style={{ listStyle: "none" }}>
            {reel.clips.map((clip, index) =>
              clipEditing === clip.id ? (
                <li key={clip.id}>
                  <ReelClipEditor
                    clipNumber={index + 1}
                    initial={clip}
                    isSaving={isSavingClip}
                    error={clipError}
                    onSave={saveClip}
                    onCancel={() => setClipEditing(null)}
                    onDelete={() => deleteClip.mutate({ id: clip.id })}
                  />
                </li>
              ) : (
                <ReelClipRow
                  key={clip.id}
                  clip={clip}
                  clipNumber={index + 1}
                  onEdit={() => setClipEditing(clip.id)}
                />
              ),
            )}
          </Box>

          {CAN_EDIT_SPOTS &&
            (clipEditing === "new" ? (
              <ReelClipEditor
                clipNumber={reel.clips.length + 1}
                isSaving={isSavingClip}
                error={clipError}
                onSave={saveClip}
                onCancel={() => setClipEditing(null)}
              />
            ) : (
              <Button
                fullWidth
                h={44}
                mt="xs"
                variant="transparent"
                color="brown.1"
                leftSection={<IconPlus size={16} stroke={2.5} />}
                onClick={() => setClipEditing("new")}
                style={{ border: "1.5px dashed var(--mantine-color-brown-2)" }}
              >
                Add clip
              </Button>
            ))}

          {CAN_EDIT_SPOTS && (
            <Group gap={0} mt="xs" justify="flex-end">
              <Button
                variant="subtle"
                color="brown.1"
                size="compact-sm"
                onClick={() => setTitleDraft(reel.title)}
              >
                Rename
              </Button>
              {reel.instagramUrl && (
                <Button
                  variant="subtle"
                  color="brown.1"
                  size="compact-sm"
                  onClick={() => setLinkSheetOpen(true)}
                >
                  Edit link
                </Button>
              )}
              <Button
                variant="subtle"
                color="red.5"
                size="compact-sm"
                onClick={confirmDeleteReel}
                loading={deleteReel.isPending}
              >
                Delete reel
              </Button>
            </Group>
          )}
        </Box>
      </Collapse>

      {CAN_EDIT_SPOTS && (
        <InstagramLinkSheet
          spotId={spotId}
          reelId={reel.id}
          reelTitle={reel.title}
          currentUrl={reel.instagramUrl}
          opened={linkSheetOpen}
          onClose={() => setLinkSheetOpen(false)}
        />
      )}
    </Paper>
  );
}
