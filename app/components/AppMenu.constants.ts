import { IconLibraryPhoto, IconListNumbers, IconMovie, IconVideo } from "@tabler/icons-react";

// The pages in the map's menu, in order. Each shows a count of what's on it.
export const APP_MENU_LINKS = [
  { href: "/up-next", label: "Up next", icon: IconListNumbers },
  { href: "/upcoming", label: "Posts", icon: IconLibraryPhoto },
  { href: "/reels", label: "Reels", icon: IconVideo },
  { href: "/b-roll", label: "B-roll shots", icon: IconMovie },
] as const;

export type AppMenuHref = (typeof APP_MENU_LINKS)[number]["href"];
