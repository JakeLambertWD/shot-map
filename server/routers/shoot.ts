import { SHOOT_DATE_PATTERN, SPOT_GEAR } from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, getDb } from "./spots";

// The day comes from the viewer's browser, so "today" follows their own clock.
const shootDateSchema = z.string().regex(SHOOT_DATE_PATTERN, "Use a YYYY-MM-DD date.");

const shootSpotSchema = z.object({
  spotId: z.string(),
  title: z.string(),
  postcode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  gear: z.enum(SPOT_GEAR),
  coverImageUrl: z.string().nullable(),
  position: z.number(),
  shotAt: z.string().nullable(),
});

export type ShootSpot = z.infer<typeof shootSpotSchema>;

const daySpotInput = z.object({ date: shootDateSchema, spotId: z.uuid() });

// A YYYY-MM-DD string as a Postgres date. shoot_date is typed as a Date, but
// the day is passed as a plain string so no time zone ever gets involved.
const asDate = (date: string) => sql<Date>`${date}::date`;

// Today's shoot: a shortlist of spots for one day, in route order, ticked off as they're shot.
export const shootRouter = router({
  list: publicProcedure.input(z.object({ date: shootDateSchema })).query(async ({ input }) => {
    const rows = await getDb()
      .selectFrom("photo_shoot_day_spot as d")
      .innerJoin("photo_spot as s", "s.id", "d.spot_id")
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom("photo_spot_image")
            .select("image_url")
            .whereRef("spot_id", "=", "s.id")
            .where((eb) => eb(eb.fn.coalesce("kind", eb.val("showcase")), "=", "showcase"))
            .orderBy("position")
            .limit(1)
            .as("cover"),
        (join) => join.onTrue(),
      )
      .select([
        "s.id as spotId",
        "s.title",
        "s.postcode",
        "s.latitude",
        "s.longitude",
        "s.gear",
        "cover.image_url as coverImageUrl",
        "d.position",
        sql<string | null>`to_char(d.shot_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`.as(
          "shotAt",
        ),
      ])
      .where("d.shoot_date", "=", asDate(input.date))
      .orderBy("d.position")
      .orderBy("d.created_at")
      .execute();

    return z.array(shootSpotSchema).parse(rows);
  }),

  // Adds the spot to the end of the day's route. Adding it twice does nothing.
  add: publicProcedure.input(daySpotInput).mutation(async ({ input }) => {
    assertCanEdit();
    const db = getDb();

    const added = await db
      .insertInto("photo_shoot_day_spot")
      .columns(["shoot_date", "spot_id", "position"])
      .expression((eb) =>
        eb
          .selectFrom("photo_spot as spot")
          .select((eb) => [
            asDate(input.date).as("shoot_date"),
            "spot.id",
            eb(
              eb.fn.coalesce(
                eb
                  .selectFrom("photo_shoot_day_spot")
                  .select((eb) => eb.fn.max("position").as("max"))
                  .where("shoot_date", "=", asDate(input.date)),
                eb.lit(-1),
              ),
              "+",
              1,
            ).as("position"),
          ])
          .where("spot.id", "=", input.spotId),
      )
      .onConflict((oc) => oc.columns(["shoot_date", "spot_id"]).doNothing())
      .returning("id")
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

  remove: publicProcedure.input(daySpotInput).mutation(async ({ input }) => {
    assertCanEdit();
    await getDb()
      .deleteFrom("photo_shoot_day_spot")
      .where("shoot_date", "=", asDate(input.date))
      .where("spot_id", "=", input.spotId)
      .execute();
  }),

  setShot: publicProcedure
    .input(daySpotInput.extend({ shot: z.boolean() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const updated = await getDb()
        .updateTable("photo_shoot_day_spot")
        .set({ shot_at: input.shot ? new Date() : null })
        .where("shoot_date", "=", asDate(input.date))
        .where("spot_id", "=", input.spotId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "That spot isn't in this shoot." });
      }
    }),

  // Moves the spots not yet shot on one day to the end of another day's route.
  moveUnshot: publicProcedure
    .input(z.object({ fromDate: shootDateSchema, toDate: shootDateSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      await getDb()
        .transaction()
        .execute(async (trx) => {
          await trx
            .insertInto("photo_shoot_day_spot")
            .columns(["shoot_date", "spot_id", "position"])
            .expression((eb) =>
              eb
                .selectFrom("photo_shoot_day_spot as d")
                .select((eb) => [
                  asDate(input.toDate).as("shoot_date"),
                  "d.spot_id",
                  eb(
                    eb.fn.coalesce(
                      eb
                        .selectFrom("photo_shoot_day_spot")
                        .select((eb) => eb.fn.max("position").as("max"))
                        .where("shoot_date", "=", asDate(input.toDate)),
                      eb.lit(-1),
                    ),
                    "+",
                    sql<number>`row_number() over (order by d.position, d.created_at)`,
                  ).as("position"),
                ])
                .where("d.shoot_date", "=", asDate(input.fromDate))
                .where("d.shot_at", "is", null),
            )
            .onConflict((oc) => oc.columns(["shoot_date", "spot_id"]).doNothing())
            .execute();

          await trx
            .deleteFrom("photo_shoot_day_spot")
            .where("shoot_date", "=", asDate(input.fromDate))
            .where("shot_at", "is", null)
            .execute();
        });
    }),
});
