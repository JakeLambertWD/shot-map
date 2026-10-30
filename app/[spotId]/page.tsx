import { Box } from "@mantine/core";
import { SpotDetail } from "./components/SpotDetail";

export default async function SpotPage({ params }: PageProps<"/[spotId]">) {
  const { spotId } = await params;

  return (
    // Full-bleed photos on mobile, so drop the default page padding.
    <Box component="main" display="block" p={0}>
      <SpotDetail spotId={spotId} />
    </Box>
  );
}
