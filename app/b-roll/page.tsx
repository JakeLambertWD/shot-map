import { Box } from "@mantine/core";
import type { Metadata } from "next";
import { BRollShots } from "./components/BRollShots";

export const metadata: Metadata = {
  title: "B-roll shots",
  description: "Camera moves and angles to capture as b-roll at a spot.",
};

export default function BRollPage() {
  return (
    <Box component="main" display="block" p={0}>
      <BRollShots />
    </Box>
  );
}
