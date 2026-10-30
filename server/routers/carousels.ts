import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, deleteSpotPhotoFiles, getDb } from "./spots";

const titleSchema = z.string().trim().min(1, "Give the carousel a name").max(80);

function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found.` });
}

// Named sets of Showcase photos. The photos themselves are added with spots.addPhotos.
export const carouselsRouter = router({
  // Adds an empty carousel at the end, named "Carousel N" unless a title is given.
  create: publicProcedure
    .input(z.object({ spotId: z.uuid(), title: titleSchema.optional() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const db = getDb();

      const { count } = await db
        .selectFrom("photo_spot_carousel")
        .select((eb) => eb.fn.countAll().as("count"))
        .where("spot_id", "=", input.spotId)
        .executeTakeFirstOrThrow();
      let carouselCount = Number(count);

      // A spot with no saved carousel shows a placeholder "Carousel 1", so save that first.
      if (carouselCount === 0) {
        await db
          .insertInto("photo_spot_carousel")
          .columns(["spot_id", "title", "position"])
          .expression((eb) =>
            eb
              .selectFrom("photo_spot")
              .select((eb) => ["id", eb.val("Carousel 1").as("title"), eb.lit(0).as("position")])
              .where("id", "=", input.spotId),
          )
          .execute();
        await db
          .updateTable("photo_spot_image")
          .set((eb) => ({
            carousel_id: eb
              .selectFrom("photo_spot_carousel")
              .select("id")
              .where("spot_id", "=", input.spotId)
              .limit(1),
          }))
          .where("spot_id", "=", input.spotId)
          .where((eb) => eb(eb.fn.coalesce("kind", eb.val("showcase")), "=", "showcase"))
          .where("carousel_id", "is", null)
          .execute();
        carouselCount = 1;
      }

      const created = await db
        .insertInto("photo_spot_carousel")
        .columns(["spot_id", "title", "position"])
        .expression((eb) =>
          eb
            .selectFrom("photo_spot as spot")
            .select((eb) => [
              "spot.id",
              eb.val(input.title ?? `Carousel ${carouselCount + 1}`).as("title"),
              eb(
                eb.fn.coalesce(
                  eb
                    .selectFrom("photo_spot_carousel")
                    .select((eb) => eb.fn.max("position").as("max"))
                    .whereRef("spot_id", "=", "spot.id"),
                  eb.lit(-1),
                ),
                "+",
                1,
              ).as("position"),
            ])
            .where("spot.id", "=", input.spotId),
        )
        .returning(["id", "title"])
        .executeTakeFirst();

      if (!created) notFound("Spot");
      return created;
    }),

  rename: publicProcedure
    .input(z.object({ id: z.uuid(), title: titleSchema }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const updated = await getDb()
        .updateTable("photo_spot_carousel")
        .set({ title: input.title })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();
      if (!updated) notFound("Carousel");
    }),

  // Deletes the carousel and its photos. Files still used elsewhere (e.g. the Editing tab) are kept.
  delete: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();
    const db = getDb();

    const photoRows = await db
      .selectFrom("photo_spot_image")
      .select("image_url")
      .where("carousel_id", "=", input.id)
      .execute();

    const deleted = await db
      .deleteFrom("photo_spot_carousel")
      .where("id", "=", input.id)
      .returning("id")
      .executeTakeFirst();
    if (!deleted) notFound("Carousel");

    const imageUrls = [...new Set(photoRows.map((row) => row.image_url))];
    if (imageUrls.length === 0) return;

    const stillUsedRows = await db
      .selectFrom("photo_spot_image")
      .select("image_url")
      .distinct()
      .where("image_url", "in", imageUrls)
      .execute();
    const stillUsed = new Set(stillUsedRows.map((row) => row.image_url));
    await deleteSpotPhotoFiles(imageUrls.filter((url) => !stillUsed.has(url)));
  }),
});
