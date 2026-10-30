import { cleanInstagramUrl, isInstagramUrl } from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, getDb } from "./spots";

const trialReelSchema = z.object({
  id: z.string(),
  instagramUrl: z.string(),
  creator: z.string().nullable(),
  // When it joined the library, or (for a spot's list) when it was picked for that spot.
  createdAt: z.string(),
});

export type TrialReel = z.infer<typeof trialReelSchema>;

const instagramUrlSchema = z
  .string()
  .trim()
  .refine(isInstagramUrl, "Paste a link from instagram.com, like a reel.")
  .transform(cleanInstagramUrl);

// "someone", "@someone " or "" → "@someone" or null.
const creatorSchema = z
  .string()
  .trim()
  .max(60)
  .transform((value) => {
    const handle = value.replace(/^@+/, "").trim();
    return handle ? `@${handle}` : null;
  });

const isoDate = (column: string) =>
  sql<string>`to_char(${sql.ref(column)} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

// One library of Instagram links to trial reel ideas, shared by every spot. Each spot's Trial
// Reels tab shows the links picked for it.
export const trialReelsRouter = router({
  // Every link in the library, newest first.
  library: publicProcedure.query(async () => {
    const rows = await getDb()
      .selectFrom("trial_reel")
      .select([
        "id",
        "instagram_url as instagramUrl",
        "creator",
        isoDate("trial_reel.created_at").as("createdAt"),
      ])
      .orderBy("created_at", "desc")
      .execute();
    return z.array(trialReelSchema).parse(rows);
  }),

  // The links picked for one spot, most recently picked first.
  list: publicProcedure.input(z.object({ spotId: z.uuid() })).query(async ({ input }) => {
    const rows = await getDb()
      .selectFrom("photo_spot_trial_reel as pick")
      .innerJoin("trial_reel as reel", "reel.id", "pick.trial_reel_id")
      .select([
        "reel.id",
        "reel.instagram_url as instagramUrl",
        "reel.creator",
        isoDate("pick.created_at").as("createdAt"),
      ])
      .where("pick.spot_id", "=", input.spotId)
      .orderBy("pick.created_at", "desc")
      .execute();
    return z.array(trialReelSchema).parse(rows);
  }),

  // How many spots have picked this link, for the remove sheet.
  usage: publicProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const { spotCount } = await getDb()
      .selectFrom("photo_spot_trial_reel")
      .select((eb) => eb.fn.countAll<number>().as("spotCount"))
      .where("trial_reel_id", "=", input.id)
      .executeTakeFirstOrThrow();
    return { spotCount: Number(spotCount) };
  }),

  // Adds a link to the library. A link that's already there is reused (and gets the creator, if
  // it had none), so the same reel is never in the library twice.
  create: publicProcedure
    .input(z.object({ instagramUrl: instagramUrlSchema, creator: creatorSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const row = await getDb()
        .insertInto("trial_reel")
        .values({ instagram_url: input.instagramUrl, creator: input.creator })
        .onConflict((oc) =>
          oc.column("instagram_url").doUpdateSet({
            creator: (eb) => eb.fn.coalesce("trial_reel.creator", "excluded.creator"),
          }),
        )
        .returning("id")
        .executeTakeFirstOrThrow();
      return { id: row.id };
    }),

  // Picks library links for a spot. Links already on it are skipped.
  addToSpot: publicProcedure
    .input(z.object({ spotId: z.uuid(), ids: z.array(z.uuid()).min(1).max(50) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      // Later picks get later times, so the first picked shows first in the newest-first grid.
      const now = Date.now();
      await getDb()
        .insertInto("photo_spot_trial_reel")
        .values(
          input.ids.map((id, index) => ({
            spot_id: input.spotId,
            trial_reel_id: id,
            created_at: new Date(now - index),
          })),
        )
        .onConflict((oc) => oc.columns(["spot_id", "trial_reel_id"]).doNothing())
        .execute();
    }),

  // Changes a link everywhere it's used.
  update: publicProcedure
    .input(z.object({ id: z.uuid(), instagramUrl: instagramUrlSchema, creator: creatorSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const db = getDb();
      const duplicate = await db
        .selectFrom("trial_reel")
        .select("id")
        .where("instagram_url", "=", input.instagramUrl)
        .where("id", "!=", input.id)
        .executeTakeFirst();
      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That link is already in your library.",
        });
      }
      const result = await db
        .updateTable("trial_reel")
        .set({ instagram_url: input.instagramUrl, creator: input.creator })
        .where("id", "=", input.id)
        .executeTakeFirst();
      if (result.numUpdatedRows === BigInt(0)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Trial reel not found." });
      }
    }),

  // Takes a link off one spot; it stays in the library.
  removeFromSpot: publicProcedure
    .input(z.object({ spotId: z.uuid(), id: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .deleteFrom("photo_spot_trial_reel")
        .where("spot_id", "=", input.spotId)
        .where("trial_reel_id", "=", input.id)
        .execute();
    }),

  // Deletes a link from the library and every spot that picked it.
  deleteEverywhere: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb().deleteFrom("trial_reel").where("id", "=", input.id).execute();
    }),
});
