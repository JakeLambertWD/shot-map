import { Box } from "@mantine/core";
import type { Metadata } from "next";
import { TodayShoot } from "./components/TodayShoot";

export const metadata: Metadata = {
  title: "Today's shoot",
  description: "The spots shortlisted for today's shoot, in route order.",
};

export default function TodayShootPage() {
  return (
    <Box component="main" display="block" p={0}>
      <TodayShoot />
    </Box>
  );
}
