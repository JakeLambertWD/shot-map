import { Box } from "@mantine/core";
import type { Metadata } from "next";
import { UpcomingPosts } from "./components/UpcomingPosts";

export const metadata: Metadata = {
  title: "Upcoming",
  description: "Carousels, photos and reels captured and waiting to be posted.",
};

export default function UpcomingPage() {
  return (
    <Box component="main" display="block" p={0}>
      <UpcomingPosts />
    </Box>
  );
}
