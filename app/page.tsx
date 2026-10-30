import type { Metadata } from "next";
import { PhotoSpotsMapLoader } from "./components/PhotoSpotsMapLoader";

export const metadata: Metadata = {
  title: "ShotMap",
  description: "Locations I want to photograph around London.",
};

export default function MapsPage() {
  return (
    <main>
      <PhotoSpotsMapLoader />
    </main>
  );
}
