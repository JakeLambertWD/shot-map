import { Box } from "@mantine/core";
import type { Metadata } from "next";
import { ReelSpots } from "./components/ReelSpots";

export const metadata: Metadata = {
  title: "Reels",
  description: "Every spot with reel ideas, and the types of reel planned there.",
};

export default function ReelsPage() {
  return (
    <Box component="main" display="block" p={0}>
      <ReelSpots />
    </Box>
  );
}
