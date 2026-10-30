import { cleanInstagramUrl, isInstagramUrl, REEL_KINDS } from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, getDb } from "./spots";

const reelClipSchema = z.object({
  id: z.string(),
  description: z.string(),
  durationSeconds: z.number().nullable(),
  position: z.number(),
});

const reelSchema = z.object({
  id: z.string(),
  kind: z.enum(REEL_KINDS),
  title: z.string(),
  instagramUrl: z.string().nullable(),
  position: z.number(),
  clips: z.array(reelClipSchema),
});

export type SpotReel = z.infer<typeof reelSchema>;
export type SpotReelClip = z.infer<typeof reelClipSchema>;

const titleSchema = z.string().trim().min(1, "Give the reel a name").max(160);
const clipDetailsSchema = z.object({
  description: z.string().trim().min(1, "Describe the clip").max(1000),
  durationSeconds: z.number().int().min(1).max(600).nullable(),
});
const instagramUrlSchema = z
  .string()
  .trim()
  .refine(isInstagramUrl, "Paste a link from instagram.com, like a reel or post.")
  .transform(cleanInstagramUrl);

function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found.` });
}

export const reelsRouter = router({
  // Reel ideas for one spot, each with its clips in order. Pass `kinds` to list several reel
  // types together (oldest first); otherwise one `kind`, in its saved order.
  list: publicProcedure
    .input(
      z.object({
        spotId: z.uuid(),
        kind: z.enum(REEL_KINDS).default("bts"),
        kinds: z.array(z.enum(REEL_KINDS)).min(1).optional(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const kinds = input.kinds ?? [input.kind];
      const isMixed = kinds.length > 1;

      const [reelRows, clipRows] = await Promise.all([
        db
          .selectFrom("photo_spot_reel")
          .select(["id", "kind", "title", "instagram_url as instagramUrl", "position"])
          .where("spot_id", "=", input.spotId)
          .where("kind", "in", kinds)
          // Positions are per type, so a mixed list goes by when each reel was added.
          .$if(!isMixed, (qb) => qb.orderBy("position"))
          .orderBy("created_at")
          .execute(),
        db
          .selectFrom("photo_spot_reel_clip as c")
          .innerJoin("photo_spot_reel as r", "r.id", "c.reel_id")
          .select([
            "c.id",
            "c.reel_id as reelId",
            "c.description",
            "c.duration_seconds as durationSeconds",
            "c.position",
          ])
          .where("r.spot_id", "=", input.spotId)
          .where("r.kind", "in", kinds)
          .orderBy("c.position")
          .execute(),
      ]);

      const reels = reelRows.map((reel) => ({
        ...reel,
        clips: clipRows.filter((clip) => clip.reelId === reel.id),
      }));

      return z.array(reelSchema).parse(reels);
    }),

  create: publicProcedure
    .input(
      z.object({ spotId: z.uuid(), kind: z.enum(REEL_KINDS).default("bts"), title: titleSchema }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();

      // New reels go to the end of the list.
      const created = await getDb()
        .insertInto("photo_spot_reel")
        .columns(["spot_id", "kind", "title", "position"])
        .expression((eb) =>
          eb
            .selectFrom("photo_spot as spot")
            .select((eb) => [
              "spot.id",
              eb.val(input.kind).as("kind"),
              eb.val(input.title).as("title"),
              eb.fn
                .coalesce(
                  eb
                    .selectFrom("photo_spot_reel")
                    .select((eb) => eb(eb.fn.max("position"), "+", 1).as("next"))
                    .whereRef("spot_id", "=", "spot.id")
                    .where("kind", "=", input.kind),
                  eb.lit(0),
                )
                .as("position"),
            ])
            .where("spot.id", "=", input.spotId),
        )
        .returning("id")
        .executeTakeFirst();

      if (!created) notFound("Spot");
      return { id: created.id };
    }),

  // Changes a reel's type, e.g. from Educational to BTS; it goes to the end of that type's list.
  setKind: publicProcedure
    .input(z.object({ id: z.uuid(), kind: z.enum(REEL_KINDS) }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel as reel")
        .set((eb) => ({
          kind: input.kind,
          position: eb.fn.coalesce(
            eb
              .selectFrom("photo_spot_reel as other")
              .select((eb) => eb(eb.fn.max("other.position"), "+", 1).as("next"))
              .whereRef("other.spot_id", "=", "reel.spot_id")
              .where("other.kind", "=", input.kind),
            eb.lit(0),
          ),
        }))
        .where("reel.id", "=", input.id)
        .returning("reel.id")
        .executeTakeFirst();
      if (!updated) notFound("Reel");
    }),

  rename: publicProcedure
    .input(z.object({ id: z.uuid(), title: titleSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel")
        .set({ title: input.title })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();
      if (!updated) notFound("Reel");
    }),

  // Pass null to remove the link.
  setInstagramUrl: publicProcedure
    .input(z.object({ id: z.uuid(), instagramUrl: instagramUrlSchema.nullable() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel")
        .set({ instagram_url: input.instagramUrl })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();
      if (!updated) notFound("Reel");
    }),

  delete: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();

    // Clips are removed by "on delete cascade".
    const deleted = await getDb()
      .deleteFrom("photo_spot_reel")
      .where("id", "=", input.id)
      .returning("id")
      .executeTakeFirst();
    if (!deleted) notFound("Reel");
  }),

  addClip: publicProcedure
    .input(clipDetailsSchema.extend({ reelId: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const created = await getDb()
        .insertInto("photo_spot_reel_clip")
        .columns(["reel_id", "description", "duration_seconds", "position"])
        .expression((eb) =>
          eb
            .selectFrom("photo_spot_reel as reel")
            .select((eb) => [
              "reel.id",
              eb.val(input.description).as("description"),
              eb.val(input.durationSeconds).as("duration_seconds"),
              eb.fn
                .coalesce(
                  eb
                    .selectFrom("photo_spot_reel_clip")
                    .select((eb) => eb(eb.fn.max("position"), "+", 1).as("next"))
                    .whereRef("reel_id", "=", "reel.id"),
                  eb.lit(0),
                )
                .as("position"),
            ])
            .where("reel.id", "=", input.reelId),
        )
        .returning("id")
        .executeTakeFirst();
      if (!created) notFound("Reel");
    }),

  updateClip: publicProcedure
    .input(clipDetailsSchema.extend({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel_clip")
        .set({ description: input.description, duration_seconds: input.durationSeconds })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();
      if (!updated) notFound("Clip");
    }),

  deleteClip: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();

    const deleted = await getDb()
      .deleteFrom("photo_spot_reel_clip")
      .where("id", "=", input.id)
      .returning("id")
      .executeTakeFirst();
    if (!deleted) notFound("Clip");
  }),
});
