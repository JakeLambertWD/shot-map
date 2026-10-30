import { router } from "../trpc";
import { placesRouter } from "./places";
import { carouselsRouter } from "./carousels";
import { creatorShotsRouter } from "./creatorShots";
import { reelsRouter } from "./reels";
import { shootRouter } from "./shoot";
import { spotsRouter } from "./spots";
import { trialReelsRouter } from "./trialReels";

// Main application router for TRPC stored endpoints
export const appRouter = router({
  places: placesRouter,
  reels: reelsRouter,
  carousels: carouselsRouter,
  creatorShots: creatorShotsRouter,
  shoot: shootRouter,
  spots: spotsRouter,
  trialReels: trialReelsRouter,
});

export type AppRouter = typeof appRouter;
