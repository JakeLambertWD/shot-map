"use client";

import { Title, Tooltip } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

type SpotTitleProps = {
  title: string;
};

// The spot name in the header, cut short with "…" when it doesn't fit.
// When it's cut short, tapping or hovering it shows the full name in a tooltip.
export function SpotTitle({ title }: SpotTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    const check = () => setIsTruncated(element.scrollWidth > element.clientWidth);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [title]);

  return (
    <Tooltip
      label={title}
      disabled={!isTruncated}
      events={{ hover: true, focus: true, touch: true }}
      multiline
      maw={280}
      withArrow
    >
      <Title
        ref={titleRef}
        order={1}
        fz="lg"
        c="brown.0"
        miw={0}
        tabIndex={isTruncated ? 0 : undefined}
        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {title}
      </Title>
    </Tooltip>
  );
}
