import { REEL_KINDS } from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, creatorSchema, getDb, instagramUrlSchema, photoKind } from "./spots";

const reelClipSchema = z.object({
  id: z.string(),
  description: z.string(),
  // The text shown on screen during the clip.
  onScreenText: z.string().nullable(),
  // Camera notes: the move, angle, lens or settings.
  howToFilm: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  position: z.number(),
});

const reelSchema = z.object({
  id: z.string(),
  kind: z.enum(REEL_KINDS),
  title: z.string(),
  instagramUrl: z.string().nullable(),
  // The Instagram creator the idea came from, e.g. "@someone".
  creator: z.string().nullable(),
  // Planned and ready to shoot.
  ready: z.boolean(),
  position: z.number(),
  clips: z.array(reelClipSchema),
});

// A spot on the Reels page.
const reelSpotSchema = z.object({
  id: z.string(),
  title: z.string(),
  postcode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  coverImageUrl: z.string().nullable(),
  reelCount: z.number(),
  kinds: z.array(z.object({ kind: z.enum(REEL_KINDS), count: z.number() })),
});

export type SpotReel = z.infer<typeof reelSchema>;
export type ReelSpot = z.infer<typeof reelSpotSchema>;
export type SpotReelClip = z.infer<typeof reelClipSchema>;

const titleSchema = z.string().trim().min(1, "Give the reel a name").max(160);
// Optional clip notes: blank saves as null.
const clipNoteSchema = z
  .string()
  .trim()
  .max(1000)
  .nullish()
  .transform((value) => value || null);
const clipDetailsSchema = z.object({
  description: z.string().trim().min(1, "Describe the clip").max(1000),
  onScreenText: clipNoteSchema,
  howToFilm: clipNoteSchema,
  durationSeconds: z.number().int().min(1).max(600).nullable(),
});

function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found.` });
}

export const reelsRouter = router({
  // Reel ideas for one spot, each with its clips in order. Pass `kinds` to list several reel
  // types together (newest first); otherwise one `kind`, in its saved order.
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
          .select([
            "id",
            "kind",
            "title",
            "instagram_url as instagramUrl",
            "creator",
            "ready",
            "position",
          ])
          .where("spot_id", "=", input.spotId)
          .where("kind", "in", kinds)
          // Positions are per type, so a mixed list goes by when each reel was added, newest
          // first so a new reel sits at the top under the add form.
          .$if(!isMixed, (qb) => qb.orderBy("position").orderBy("created_at"))
          .$if(isMixed, (qb) => qb.orderBy("created_at", "desc"))
          .execute(),
        db
          .selectFrom("photo_spot_reel_clip as c")
          .innerJoin("photo_spot_reel as r", "r.id", "c.reel_id")
          .select([
            "c.id",
            "c.reel_id as reelId",
            "c.description",
            "c.on_screen_text as onScreenText",
            "c.how_to_film as howToFilm",
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

  // Every spot with reel ideas, for the Reels page, in its saved order (spots not placed yet
  // first, newest first), with how many reels of each type it has. Trial Reels aren't counted,
  // as on the map's Reels filter.
  spots: publicProcedure.query(async () => {
    const db = getDb();

    const [spotRows, countRows] = await Promise.all([
      db
        .selectFrom("photo_spot as s")
        .select((eb) => [
          "s.id",
          "s.title",
          "s.postcode",
          "s.latitude",
          "s.longitude",
          // The spot's first Showcase photo, as on the map.
          eb
            .selectFrom("photo_spot_image")
            .select("image_url")
            .whereRef("spot_id", "=", "s.id")
            .where((eb) => eb(photoKind(eb), "=", "showcase"))
            .orderBy("position")
            .limit(1)
            .as("coverImageUrl"),
        ])
        .where(({ exists, selectFrom }) =>
          exists(
            selectFrom("photo_spot_reel")
              .select("id")
              .whereRef("spot_id", "=", "s.id")
              .where("kind", "!=", "pov"),
          ),
        )
        .orderBy("s.reels_position", (ob) => ob.asc().nullsFirst())
        .orderBy("s.created_at", "desc")
        .execute(),
      db
        .selectFrom("photo_spot_reel")
        .select((eb) => [
          "spot_id as spotId",
          "kind",
          eb.cast<number>(eb.fn.countAll(), "integer").as("count"),
        ])
        .where("kind", "!=", "pov")
        .groupBy(["spot_id", "kind"])
        .execute(),
    ]);

    const spots = spotRows.map((spot) => {
      const kinds = countRows
        .filter((row) => row.spotId === spot.id)
        .map(({ kind, count }) => ({ kind, count }));
      return { ...spot, kinds, reelCount: kinds.reduce((total, { count }) => total + count, 0) };
    });

    return z.array(reelSpotSchema).parse(spots);
  }),

  // Saves the Reels page's order: every spot on it, top first.
  reorderSpots: publicProcedure
    .input(z.object({ spotIds: z.array(z.uuid()).min(1).max(500) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      // Raw SQL: Kysely has no builder for unnest, and this updates every spot in one query.
      await sql`
        update photo_spot spot
        set reels_position = slots.position - 1
        from unnest(${input.spotIds}::uuid[]) with ordinality as slots(id, position)
        where spot.id = slots.id
      `.execute(getDb());
    }),

  create: publicProcedure
    .input(
      z.object({
        spotId: z.uuid(),
        kind: z.enum(REEL_KINDS).default("bts"),
        title: titleSchema,
        creator: creatorSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();

      // New reels go to the end of the list.
      const created = await getDb()
        .insertInto("photo_spot_reel")
        .columns(["spot_id", "kind", "title", "creator", "position"])
        .expression((eb) =>
          eb
            .selectFrom("photo_spot as spot")
            .select((eb) => [
              "spot.id",
              eb.val(input.kind).as("kind"),
              eb.val(input.title).as("title"),
              eb.val(input.creator ?? null).as("creator"),
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

  setReady: publicProcedure
    .input(z.object({ id: z.uuid(), ready: z.boolean() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel")
        .set({ ready: input.ready })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();
      if (!updated) notFound("Reel");
    }),

  // An empty creator removes it.
  setCreator: publicProcedure
    .input(z.object({ id: z.uuid(), creator: creatorSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_reel")
        .set({ creator: input.creator })
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
        .columns([
          "reel_id",
          "description",
          "on_screen_text",
          "how_to_film",
          "duration_seconds",
          "position",
        ])
        .expression((eb) =>
          eb
            .selectFrom("photo_spot_reel as reel")
            .select((eb) => [
              "reel.id",
              eb.val(input.description).as("description"),
              eb.val(input.onScreenText).as("on_screen_text"),
              eb.val(input.howToFilm).as("how_to_film"),
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
        .set({
          description: input.description,
          on_screen_text: input.onScreenText,
          how_to_film: input.howToFilm,
          duration_seconds: input.durationSeconds,
        })
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
