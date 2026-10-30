"use client";

import { InstagramLinkSheet } from "@/app/[spotId]/components/reels/InstagramLinkSheet";
import { ReelClipEditor, type ReelClipDraft } from "@/app/[spotId]/components/reels/ReelClipEditor";
import { CLIP_DIVIDER, REEL_CARD_BORDER } from "@/app/[spotId]/components/reels/Reels.constants";
import { ReelTypePill } from "@/app/[spotId]/components/reels/ReelTypePill";
import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS, type ReelKind } from "@/lib/photo-spots";
import { getPhotoUploadErrorMessage } from "@/lib/upload-spot-photo";
import { uploadUpcomingMedia, type UploadedMedia } from "@/lib/upload-upcoming-media";
import type { UpcomingPost, UpcomingPostMedia } from "@/server/routers/upcomingPosts";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Collapse,
  FileButton,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBrandInstagram,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPlayFilled,
  IconPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { formatReelPostSummary } from "./UpcomingPosts.constants";

type UpcomingReelCardProps = {
  post: UpcomingPost;
  expanded: boolean;
  onToggle: () => void;
  onEditDetails: () => void;
};

// A reel waiting to be posted, laid out like a reel idea on a spot's Reels tab: title, type pill,
// Instagram inspo and the clips, which here are the videos you've uploaded.
export function UpcomingReelCard({
  post,
  expanded,
  onToggle,
  onEditDetails,
}: UpcomingReelCardProps) {
  const utils = api.useUtils();
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<UpcomingPostMedia | null>(null);
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const refresh = () => utils.upcomingPosts.list.invalidate();
  const closeEditor = { onSuccess: async () => (await refresh(), setEditingClipId(null)) };

  const setReelType = api.upcomingPosts.setReelType.useMutation({ onSuccess: refresh });
  const setInstagramUrl = api.upcomingPosts.setInstagramUrl.useMutation({ onSuccess: refresh });
  const updateClip = api.upcomingPosts.updateMedia.useMutation(closeEditor);
  const deleteClip = api.upcomingPosts.deleteMedia.useMutation(closeEditor);
  const addMedia = api.upcomingPosts.addMedia.useMutation();
  const isSavingClip = updateClip.isPending || deleteClip.isPending;

  async function addClips(files: File[]) {
    if (files.length === 0) return;
    setUploadError(null);
    try {
      const media: UploadedMedia[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading clip ${index + 1} of ${files.length}…`);
        media.push(await uploadUpcomingMedia(file, post.title));
      }
      setProgress("Saving…");
      await addMedia.mutateAsync({ postId: post.id, media });
      await refresh();
    } catch (error) {
      setUploadError(getPhotoUploadErrorMessage(error));
    } finally {
      setProgress(null);
    }
  }

  return (
    <Paper bg="brown.6" radius="md" style={{ border: REEL_CARD_BORDER }}>
      <Group gap="xs" wrap="nowrap" align="flex-start" p="sm" pr="xs">
        <Stack gap={6} flex={1} miw={0}>
          <UnstyledButton onClick={onToggle} aria-expanded={expanded}>
            <Title order={3} fz={expanded ? 16 : 15} lh={1.3} c="brown.0">
              {post.title}
            </Title>
          </UnstyledButton>
          <Group gap={8} wrap="nowrap">
            {post.reelType && (
              <ReelTypePill
                kind={post.reelType as ReelKind}
                isSaving={setReelType.isPending}
                onChange={(kind) =>
                  setReelType.mutate({
                    id: post.id,
                    reelType: kind as "educational" | "technique" | "bts",
                  })
                }
              />
            )}
            <Text fz="xs" c="brown.1" truncate>
              {formatReelPostSummary(post)}
            </Text>
          </Group>
        </Stack>

        {post.instagramUrl ? (
          <ActionIcon
            component="a"
            href={post.instagramUrl}
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
            {post.media.map((clip, index) =>
              editingClipId === clip.id ? (
                <li key={clip.id}>
                  <ReelClipEditor
                    clipNumber={index + 1}
                    initial={{
                      description: clip.description,
                      durationSeconds: clip.durationSeconds,
                    }}
                    isSaving={isSavingClip}
                    error={updateClip.error?.message ?? deleteClip.error?.message}
                    onSave={(draft: ReelClipDraft) => updateClip.mutate({ id: clip.id, ...draft })}
                    onCancel={() => setEditingClipId(null)}
                    onDelete={() => deleteClip.mutate({ id: clip.id })}
                  />
                </li>
              ) : (
                <ClipRow
                  key={clip.id}
                  clip={clip}
                  clipNumber={index + 1}
                  onPlay={() => setPlaying(clip)}
                  onEdit={() => setEditingClipId(clip.id)}
                />
              ),
            )}
          </Box>

          {CAN_EDIT_SPOTS && (
            <FileButton onChange={addClips} accept="video/*" multiple disabled={progress !== null}>
              {(buttonProps) => (
                <Button
                  {...buttonProps}
                  fullWidth
                  h={44}
                  mt="xs"
                  variant="transparent"
                  color="brown.1"
                  loading={progress !== null}
                  leftSection={<IconPlus size={16} stroke={2.5} />}
                  style={{ border: "1.5px dashed var(--mantine-color-brown-2)" }}
                >
                  Add clip
                </Button>
              )}
            </FileButton>
          )}
          {(progress || uploadError) && (
            <Text
              fz="xs"
              c={uploadError ? "red.4" : "brown.1"}
              mt={6}
              role={uploadError ? "alert" : undefined}
            >
              {uploadError ?? progress}
            </Text>
          )}

          {CAN_EDIT_SPOTS && (
            <Group gap={0} mt="xs" justify="flex-end">
              <Button variant="subtle" color="brown.1" size="compact-sm" onClick={onEditDetails}>
                Edit details
              </Button>
              {post.instagramUrl && (
                <Button
                  variant="subtle"
                  color="brown.1"
                  size="compact-sm"
                  onClick={() => setLinkSheetOpen(true)}
                >
                  Edit link
                </Button>
              )}
            </Group>
          )}
        </Box>
      </Collapse>

      {CAN_EDIT_SPOTS && (
        <InstagramLinkSheet
          reelTitle={post.title}
          currentUrl={post.instagramUrl}
          opened={linkSheetOpen}
          onClose={() => setLinkSheetOpen(false)}
          onSave={(instagramUrl) => setInstagramUrl.mutateAsync({ id: post.id, instagramUrl })}
        />
      )}

      <Modal
        opened={playing !== null}
        onClose={() => setPlaying(null)}
        title={playing ? `Clip ${post.media.findIndex((clip) => clip.id === playing.id) + 1}` : ""}
        centered
        size="auto"
      >
        {playing && (
          <video
            src={playing.mediaUrl}
            controls
            autoPlay
            playsInline
            style={{ display: "block", maxWidth: "100%", maxHeight: "75dvh", borderRadius: 8 }}
          />
        )}
      </Modal>
    </Paper>
  );
}

function ClipRow({
  clip,
  clipNumber,
  onPlay,
  onEdit,
}: {
  clip: UpcomingPostMedia;
  clipNumber: number;
  onPlay: () => void;
  onEdit: () => void;
}) {
  const details = (
    <>
      <Text
        flex={1}
        fz="sm"
        lh={1.35}
        c={clip.description ? "brown.0" : "brown.2"}
        style={{ whiteSpace: "pre-line" }}
      >
        {clip.description || (CAN_EDIT_SPOTS ? "Describe this clip" : "No description")}
      </Text>
      {clip.durationSeconds && (
        <Text ff="monospace" fz={11} c="brown.1" pt={3}>
          {clip.durationSeconds}s
        </Text>
      )}
    </>
  );

  return (
    <Group
      component="li"
      gap="sm"
      wrap="nowrap"
      align="flex-start"
      py="xs"
      style={{ borderTop: CLIP_DIVIDER }}
    >
      <Center
        w={22}
        h={22}
        bdrs="xl"
        bg="brown.4"
        c="yellow.5"
        fz={11}
        fw={700}
        style={{ flexShrink: 0 }}
      >
        {clipNumber}
      </Center>
      <UnstyledButton
        onClick={onPlay}
        aria-label={`Play clip ${clipNumber}`}
        pos="relative"
        w={36}
        h={64}
        bg="brown.5"
        style={{ borderRadius: 4, overflow: "hidden", flex: "none" }}
      >
        <video
          src={`${clip.mediaUrl}#t=0.1`}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Center pos="absolute" inset={0} aria-hidden>
          <IconPlayerPlayFilled size={14} color="var(--mantine-color-brown-0)" />
        </Center>
      </UnstyledButton>
      {CAN_EDIT_SPOTS ? (
        <UnstyledButton
          onClick={onEdit}
          aria-label={`Edit clip ${clipNumber}`}
          flex={1}
          ta="left"
          style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
        >
          {details}
        </UnstyledButton>
      ) : (
        details
      )}
    </Group>
  );
}
