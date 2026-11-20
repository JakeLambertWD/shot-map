import { SPOT_GEAR, UP_NEXT_CONTENT } from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, getDb, photoKind } from "./spots";

const upNextSpotSchema = z.object({
  id: z.string(),
  title: z.string(),
  postcode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  gear: z.enum(SPOT_GEAR),
  // Weather the spot suits, as on the map.
  tags: z.array(z.string()),
  coverImageUrl: z.string().nullable(),
  // What the spot is being shot for: a reel, a carousel, or both.
  content: z.enum(UP_NEXT_CONTENT),
});

export type UpNextSpot = z.infer<typeof upNextSpotSchema>;

const spotInput = z.object({ spotId: z.uuid() });

// Up next: spots to shoot in the near future, in the order they'll be shot.
export const upNextRouter = router({
  list: publicProcedure.query(async () => {
    const rows = await getDb()
      .selectFrom("photo_spot_up_next as u")
      .innerJoin("photo_spot as s", "s.id", "u.spot_id")
      .select((eb) => [
        "s.id",
        "s.title",
        "s.postcode",
        "s.latitude",
        "s.longitude",
        "s.gear",
        "s.tags",
        "u.content",
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
      .orderBy("u.position")
      .orderBy("u.created_at")
      .execute();

    return z.array(upNextSpotSchema).parse(rows);
  }),

  // Adds the spot to the end of the list. Adding it twice does nothing.
  add: publicProcedure.input(spotInput).mutation(async ({ input }) => {
    assertCanEdit();
    const db = getDb();

    const added = await db
      .insertInto("photo_spot_up_next")
      .columns(["spot_id", "position"])
      .expression((eb) =>
        eb
          .selectFrom("photo_spot as spot")
          .select((eb) => [
            "spot.id",
            eb(
              eb.fn.coalesce(
                eb.selectFrom("photo_spot_up_next").select((eb) => eb.fn.max("position").as("max")),
                eb.lit(-1),
              ),
              "+",
              1,
            ).as("position"),
          ])
          .where("spot.id", "=", input.spotId),
      )
      .onConflict((oc) => oc.column("spot_id").doNothing())
      .returning("spot_id")
      .executeTakeFirst();

    if (!added) {
      const spot = await db
        .selectFrom("photo_spot")
        .select("id")
        .where("id", "=", input.spotId)
        .executeTakeFirst();
      if (!spot) throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
    }
  }),

  remove: publicProcedure.input(spotInput).mutation(async ({ input }) => {
    assertCanEdit();
    await getDb().deleteFrom("photo_spot_up_next").where("spot_id", "=", input.spotId).execute();
  }),

  setContent: publicProcedure
    .input(spotInput.extend({ content: z.enum(UP_NEXT_CONTENT) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .updateTable("photo_spot_up_next")
        .set({ content: input.content })
        .where("spot_id", "=", input.spotId)
        .execute();
    }),

  // Saves the list's order: every spot on it, top first.
  reorder: publicProcedure
    .input(z.object({ spotIds: z.array(z.uuid()).min(1).max(500) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      // Raw SQL: Kysely has no builder for unnest, and this updates every row in one query.
      await sql`
        update photo_spot_up_next up_next
        set position = slots.position - 1
        from unnest(${input.spotIds}::uuid[]) with ordinality as slots(id, position)
        where up_next.spot_id = slots.id
      `.execute(getDb());
    }),
});
