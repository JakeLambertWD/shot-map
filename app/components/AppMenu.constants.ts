import { IconListNumbers, IconMovie, IconVideo } from "@tabler/icons-react";

// The pages in the map's menu, in order.
export const APP_MENU_LINKS = [
  { href: "/b-roll", label: "B-roll shots", icon: IconMovie },
  { href: "/reels", label: "Reels", icon: IconVideo },
  { href: "/up-next", label: "Up next", icon: IconListNumbers },
] as const;
