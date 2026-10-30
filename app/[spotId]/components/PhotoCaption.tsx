"use client";

import { api } from "@/app/providers";
import { CAN_EDIT_SPOTS } from "@/lib/photo-spots";
import { Text, Textarea, UnstyledButton } from "@mantine/core";
import { useLayoutEffect, useRef, useState } from "react";

type PhotoCaptionProps = {
  spotId: string;
  photoId: string;
  photoIndex: number;
  caption: string | null;
};

export function PhotoCaption({ spotId, photoId, photoIndex, caption }: PhotoCaptionProps) {
  const utils = api.useUtils();
  const [draft, setDraft] = useState<string | null>(null);
  const boxRef = useRef<HTMLElement | null>(null);
  const fillHeight = useFillRemainingHeight(boxRef, draft !== null);

  // Grow the text box to fit everything typed, so the last line is never cut off.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (draft === null || !(box instanceof HTMLTextAreaElement)) return;
    box.style.height = "auto";
    const border = box.offsetHeight - box.clientHeight;
    box.style.height = `${box.scrollHeight + border}px`;
  }, [draft]);

  const updateCaption = api.spots.updatePhotoCaption.useMutation({
    onSuccess: async () => {
      await utils.spots.byId.invalidate({ id: spotId });
      setDraft(null);
    },
  });

  const label = `Note for photo ${photoIndex + 1}`;
  // The same yellow box while reading and typing, so the note doesn't shift when tapped.
  const fieldBox = {
    padding: "10px 12px",
    border: "1px solid var(--mantine-color-yellow-5)",
    borderRadius: "var(--mantine-radius-sm)",
    boxSizing: "border-box" as const,
    minHeight: fillHeight,
  };
  const text = (
    <Text
      ff="text"
      fz={18}
      fw={500}
      lh={1.45}
      c={caption ? "brown.0" : "brown.1"}
      // Keep the line breaks and blank lines exactly as typed.
      style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
    >
      {caption ?? (CAN_EDIT_SPOTS ? "Write here.." : "No note for this photo yet.")}
    </Text>
  );

  if (!CAN_EDIT_SPOTS) return <section aria-label={label}>{text}</section>;

  if (draft === null) {
    return (
      <UnstyledButton
        ref={(element) => {
          boxRef.current = element;
        }}
        aria-label={`Edit ${label.toLowerCase()}`}
        onClick={() => setDraft(caption ?? "")}
        w="100%"
        ta="left"
        // A button centres its content vertically; keep the note at the top of the box.
        style={{
          ...fieldBox,
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        {text}
      </UnstyledButton>
    );
  }

  function save() {
    if (draft === null || updateCaption.isPending) return;

    if (draft.trim() === (caption ?? "")) {
      setDraft(null);
      return;
    }

    updateCaption.mutate({ photoId, caption: draft });
  }

  return (
    <Textarea
      variant="unstyled"
      ref={(element) => {
        boxRef.current = element;
      }}
      classNames={{ input: "photo-caption-input" }}
      aria-label={label}
      styles={{
        input: {
          ...fieldBox,
          // The yellow border plus Mantine's own focus ring would double up.
          outline: "none",
          display: "block",
          fontWeight: 500,
          lineHeight: 1.45,
          color: "var(--mantine-color-brown-0)",
        },
        error: { marginTop: 4 },
      }}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Escape") setDraft(null);
      }}
      error={updateCaption.error?.message}
      readOnly={updateCaption.isPending}
      rows={1}
      maxLength={2000}
      data-autofocus
      autoFocus
      onFocus={(event) => {
        const end = event.currentTarget.value.length;
        event.currentTarget.setSelectionRange(end, end);
      }}
    />
  );
}

// The height that makes the box reach the bottom of the screen, leaving room for anything
// below it on the page. Undefined when the page is already taller than the screen.
function useFillRemainingHeight(boxRef: { current: HTMLElement | null }, key: unknown) {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const box = boxRef.current;
    // The page's content column; <main> itself is stretched to the screen height already.
    const page = box?.closest("main")?.firstElementChild;
    if (!box || !page) return;

    function measure() {
      if (!box || !page) return;
      const boxRect = box.getBoundingClientRect();
      // Everything under the box (other notes, the page's bottom padding) moves with it,
      // so this gap doesn't depend on the box's own height.
      const below = page.getBoundingClientRect().bottom - boxRect.bottom;
      const top = boxRect.top + window.scrollY;
      const fill = Math.floor(window.innerHeight - top - below);
      setHeight(fill > 0 ? fill : undefined);
    }

    measure();
    // Photos loading above, or notes changing below, move the box.
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [boxRef, key]);

  return height;
}
