import { Box } from "@mantine/core";
import type { Metadata } from "next";
import { UpNextSpots } from "./components/UpNextSpots";

export const metadata: Metadata = {
  title: "Up next",
  description: "The spots to shoot in the near future, in order.",
};

export default function UpNextPage() {
  return (
    <Box component="main" display="block" p={0}>
      <UpNextSpots />
    </Box>
  );
}
