import { Box } from "@mantine/core";
import { getSpotTabFromQuery } from "./components/SpotContentTabs.constants";
import { SpotDetail } from "./components/SpotDetail";

export default async function SpotPage({ params, searchParams }: PageProps<"/[spotId]">) {
  const { spotId } = await params;
  const { tab } = await searchParams;

  return (
    // Full-bleed photos on mobile, so drop the default page padding.
    <Box component="main" display="block" p={0}>
      <SpotDetail spotId={spotId} initialTab={getSpotTabFromQuery(tab)} />
    </Box>
  );
}
