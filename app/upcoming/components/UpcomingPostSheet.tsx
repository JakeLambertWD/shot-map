"use client";

import { REEL_TYPE_KINDS, REEL_TYPE_STYLES } from "@/app/[spotId]/components/reels/Reels.constants";
import { api } from "@/app/providers";
import { getPhotoUploadErrorMessage } from "@/lib/upload-spot-photo";
import { MAX_UPCOMING_MEDIA } from "@/lib/photo-spots";
import { uploadUpcomingMedia, type UploadedMedia } from "@/lib/upload-upcoming-media";
import type { UpcomingPost, UpcomingPostKind } from "@/server/routers/upcomingPosts";
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Drawer,
  FileButton,
  Group,
  Image,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { IconPlayerPlayFilled, IconUpload, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { UPCOMING_KIND_OPTIONS } from "./UpcomingPosts.constants";

type UpcomingPostSheetProps = {
  opened: boolean;
  // The post being edited; null adds a new one.
  post: UpcomingPost | null;
  // The type a new post starts as.
  defaultKind: UpcomingPostKind;
  onClose: () => void;
};

type ReelType = (typeof REEL_TYPE_KINDS)[number];

// Adds an upcoming post (type, title, photos or clips, caption and spot), or edits one's details.
export function UpcomingPostSheet(props: UpcomingPostSheetProps) {
  return (
    <Drawer
      opened={props.opened}
      onClose={props.onClose}
      position="bottom"
      radius="xl"
      // Size the sheet to its content, and keep it as wide as the page (30rem).
      styles={{
        inner: { justifyContent: "center" },
        content: {
          flex: "0 0 auto",
          height: "auto",
          maxHeight: "92dvh",
          width: "100%",
          maxWidth: "30rem",
        },
      }}
      title={
        <Text component="span" ff="heading" fz="lg" fw={600} c="brown.0">
          {props.post ? "Edit upcoming post" : "Add an upcoming post"}
        </Text>
      }
    >
      {/* Remount each time it opens so the fields start fresh. */}
      {props.opened && <PostForm key={props.post?.id ?? "new"} {...props} />}
    </Drawer>
  );
}

// A file picked in the add sheet, shown as a preview until it's uploaded on save.
type PickedFile = { file: File; previewUrl: string };

function PostForm({ post, defaultKind, onClose }: UpcomingPostSheetProps) {
  const theme = useMantineTheme();
  const utils = api.useUtils();
  const spotsQuery = api.spots.list.useQuery();

  const [kind, setKind] = useState<UpcomingPostKind>(post?.kind ?? defaultKind);
  const [title, setTitle] = useState(post?.title ?? "");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [reelType, setReelType] = useState<ReelType>((post?.reelType as ReelType) ?? "bts");
  const [spotId, setSpotId] = useState<string | null>(post?.spotId ?? null);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTitleError, setShowTitleError] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Free the previews' memory when the sheet closes.
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(
    () => () => pickedRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [],
  );

  const create = api.upcomingPosts.create.useMutation();
  const update = api.upcomingPosts.update.useMutation();
  const addMedia = api.upcomingPosts.addMedia.useMutation();
  const deleteMedia = api.upcomingPosts.deleteMedia.useMutation({
    onSuccess: () => utils.upcomingPosts.list.invalidate(),
  });
  const deletePost = api.upcomingPosts.delete.useMutation({
    onSuccess: async () => {
      await utils.upcomingPosts.list.invalidate();
      onClose();
    },
  });

  const isEditing = post !== null;
  const isBusy = progress !== null || deletePost.isPending;
  const accept = kind === "reel" ? "video/*" : kind === "single" ? "image/*" : "image/*,video/*";
  const maxFiles = kind === "single" ? 1 : MAX_UPCOMING_MEDIA;
  const savedMedia = post?.media ?? [];
  const mediaCount = (isEditing ? savedMedia.length : picked.length) || 0;

  const spotOptions = useMemo(
    () =>
      (spotsQuery.data ?? [])
        .map((spot) => ({ value: spot.id, label: spot.title }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [spotsQuery.data],
  );

  function pickFiles(files: File[]) {
    setError(null);
    const room = maxFiles - mediaCount;
    if (files.length > room) setError(`This post can have up to ${maxFiles} files.`);
    const next = files
      .slice(0, Math.max(room, 0))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    if (isEditing) void uploadToPost(next.map((item) => item.file));
    else setPicked((current) => [...current, ...next]);
  }

  async function uploadAll(files: File[], postTitle: string) {
    const uploaded: UploadedMedia[] = [];
    for (const [index, file] of files.entries()) {
      setProgress(`Uploading ${index + 1} of ${files.length}…`);
      uploaded.push(await uploadUpcomingMedia(file, postTitle));
    }
    return uploaded;
  }

  // Editing: new photos go straight onto the saved post.
  async function uploadToPost(files: File[]) {
    if (!post || files.length === 0) return;
    try {
      const media = await uploadAll(files, post.title);
      setProgress("Saving…");
      await addMedia.mutateAsync({ postId: post.id, media });
      await utils.upcomingPosts.list.invalidate();
    } catch (uploadError) {
      setError(getPhotoUploadErrorMessage(uploadError));
    } finally {
      setProgress(null);
    }
  }

  async function save() {
    setShowTitleError(true);
    setError(null);
    if (!title.trim()) return;

    try {
      if (isEditing) {
        setProgress("Saving…");
        await update.mutateAsync({ id: post.id, title, caption, spotId });
      } else {
        const media = await uploadAll(
          picked.map((item) => item.file),
          title,
        );
        setProgress("Saving…");
        await create.mutateAsync({
          kind,
          title,
          caption: kind === "reel" ? "" : caption,
          reelType: kind === "reel" ? reelType : null,
          spotId,
          media,
        });
      }
      await utils.upcomingPosts.list.invalidate();
      onClose();
    } catch (saveError) {
      setError(getPhotoUploadErrorMessage(saveError));
    } finally {
      setProgress(null);
    }
  }

  if (post && isConfirmingDelete) {
    return (
      <Stack gap="md" pb="md">
        <Text fz="sm" c="brown.1" lh={1.45}>
          Posted it, or dropping the idea? This deletes “{post.title}” and its{" "}
          {post.media.length === 1 ? "file" : `${post.media.length} files`}. This can&apos;t be
          undone.
        </Text>
        {deletePost.error && (
          <Text fz="sm" c="red.4" role="alert">
            {deletePost.error.message}
          </Text>
        )}
        <Group gap="sm" grow>
          <Button
            h={52}
            variant="default"
            onClick={() => setIsConfirmingDelete(false)}
            disabled={isBusy}
          >
            Back
          </Button>
          <Button
            h={52}
            color="red.7"
            fw={900}
            onClick={() => deletePost.mutate({ id: post.id })}
            loading={deletePost.isPending}
          >
            Delete post
          </Button>
        </Group>
      </Stack>
    );
  }

  // Thumbnails: the saved media when editing, or the picked files when adding.
  const thumbs = isEditing
    ? savedMedia.map((media) => ({
        key: media.id,
        // The small copy, so opening the sheet doesn't download full-size photos.
        url: media.thumbnailUrl ?? media.mediaUrl,
        isVideo: media.mediaType === "video",
        // Saved videos show their poster, so opening the sheet downloads no video.
        posterUrl: media.posterUrl,
        onRemove: () => deleteMedia.mutate({ id: media.id }),
      }))
    : picked.map((item, index) => ({
        key: item.previewUrl,
        url: item.previewUrl,
        isVideo: item.file.type.startsWith("video/"),
        // Picked files are still on this device, so previewing the video itself is free.
        posterUrl: null,
        onRemove: () => {
          URL.revokeObjectURL(item.previewUrl);
          setPicked((current) => current.filter((_, other) => other !== index));
        },
      }));

  // Reel clips are managed on the card itself once the reel exists.
  const showMedia = !isEditing || post.kind !== "reel";

  return (
    <Stack gap="md" pb="md">
      {!isEditing && (
        <SegmentedControl
          fullWidth
          size="md"
          radius="md"
          aria-label="Post type"
          data={UPCOMING_KIND_OPTIONS}
          value={kind}
          onChange={(value) => {
            setKind(value as UpcomingPostKind);
            // Files picked for another type may not fit this one.
            picked.forEach((item) => URL.revokeObjectURL(item.previewUrl));
            setPicked([]);
          }}
          color="yellow"
          autoContrast
          styles={{ label: { fontWeight: 700 } }}
          disabled={isBusy}
        />
      )}

      <TextInput
        size="md"
        label="Title"
        placeholder={kind === "reel" ? "e.g. Bank BTS" : "e.g. Canary Wharf hero set"}
        value={title}
        onChange={(event) => setTitle(event.currentTarget.value)}
        error={showTitleError && !title.trim() ? "Give the post a title" : null}
        maxLength={160}
        data-autofocus
      />

      {!isEditing && kind === "reel" && (
        <Stack gap={6} role="group" aria-label="Reel type">
          <Text fz="sm" fw={500} c="brown.0">
            Reel type
          </Text>
          <Group gap={6}>
            {REEL_TYPE_KINDS.map((option) => {
              const style = REEL_TYPE_STYLES[option];
              const isActive = option === reelType;
              return (
                <UnstyledButton
                  key={option}
                  aria-pressed={isActive}
                  onClick={() => setReelType(option)}
                  h={36}
                  px={12}
                  fz={13}
                  fw={isActive ? 900 : 700}
                  style={{
                    borderRadius: 18,
                    border: `1px solid ${isActive ? style.color : theme.colors.brown[4]}`,
                    backgroundColor: isActive ? style.tint : "transparent",
                    color: isActive ? style.text : theme.colors.brown[0],
                  }}
                >
                  {style.label}
                </UnstyledButton>
              );
            })}
          </Group>
        </Stack>
      )}

      {showMedia && (
        <Stack gap={6}>
          <Text fz="sm" fw={500} c="brown.0">
            {kind === "reel"
              ? "Clips · each becomes a numbered clip you can describe"
              : kind === "single"
                ? "Photo"
                : "Photos & videos"}
          </Text>
          <Group gap={8}>
            {thumbs.map((thumb, index) => (
              <Box
                key={thumb.key}
                pos="relative"
                w={kind === "reel" ? 54 : 72}
                h={kind === "reel" ? 96 : 90}
                style={{ borderRadius: 6, overflow: "hidden", flex: "none" }}
                bg="brown.6"
              >
                {thumb.isVideo ? (
                  <>
                    {isEditing ? (
                      thumb.posterUrl && (
                        <Image src={thumb.posterUrl} alt="" w="100%" h="100%" fit="cover" />
                      )
                    ) : (
                      <video
                        src={`${thumb.url}#t=0.1`}
                        muted
                        playsInline
                        preload="metadata"
                        aria-hidden
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                    <Center pos="absolute" inset={0} aria-hidden>
                      <IconPlayerPlayFilled size={16} color={theme.colors.brown[0]} />
                    </Center>
                  </>
                ) : (
                  <Image src={thumb.url} alt="" w="100%" h="100%" fit="cover" />
                )}
                <ActionIcon
                  aria-label={`Remove ${thumb.isVideo ? "clip" : "photo"} ${index + 1}`}
                  onClick={thumb.onRemove}
                  disabled={isBusy || deleteMedia.isPending}
                  pos="absolute"
                  top={3}
                  right={3}
                  size={24}
                  radius="xl"
                  variant="filled"
                  color="rgba(0, 0, 0, 0.65)"
                >
                  <IconX size={14} color={theme.colors.brown[0]} />
                </ActionIcon>
              </Box>
            ))}
            {mediaCount < maxFiles && (
              <FileButton
                onChange={(payload) => pickFiles(payload ? ([] as File[]).concat(payload) : [])}
                accept={accept}
                multiple={maxFiles > 1}
                disabled={isBusy}
              >
                {(buttonProps) => (
                  <UnstyledButton
                    {...buttonProps}
                    aria-label={kind === "reel" ? "Upload clips" : "Upload photos"}
                    w={kind === "reel" ? 54 : 72}
                    h={kind === "reel" ? 96 : 90}
                    style={{
                      borderRadius: 6,
                      border: `1.5px dashed ${theme.colors.brown[2]}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      color: theme.colors.brown[1],
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <IconUpload size={20} color={theme.colors.yellow[5]} />
                    {kind !== "reel" && "Upload"}
                  </UnstyledButton>
                )}
              </FileButton>
            )}
          </Group>
        </Stack>
      )}

      {kind !== "reel" && (
        <Textarea
          size="md"
          label="Caption"
          placeholder="What you'll write with the post"
          value={caption}
          onChange={(event) => setCaption(event.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={8}
          maxLength={2200}
        />
      )}

      <Select
        size="md"
        label="Spot"
        placeholder="Pick a spot"
        data={spotOptions}
        value={spotId}
        onChange={setSpotId}
        searchable
        clearable
        nothingFoundMessage="No spots match"
        comboboxProps={{ zIndex: 400 }}
      />

      {error && (
        <Text fz="sm" c="red.4" role="alert">
          {error}
        </Text>
      )}

      <Button h={52} onClick={save} loading={progress !== null} autoContrast fz={15} fw={900}>
        {progress ?? (isEditing ? "Save changes" : "Add to upcoming")}
      </Button>

      {isEditing && (
        <Button
          variant="subtle"
          color="red.5"
          onClick={() => setIsConfirmingDelete(true)}
          disabled={isBusy}
        >
          Delete post
        </Button>
      )}
    </Stack>
  );
}
