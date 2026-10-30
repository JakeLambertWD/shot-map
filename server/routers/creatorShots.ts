import { isSpotPhotoUrl } from "@/lib/photo-spots";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, deleteSpotPhotoFiles, getDb } from "./spots";

const creatorShotSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  createdAt: z.string(),
  // The spot it was first uploaded for, if that spot still exists.
  originSpotTitle: z.string().nullable(),
});

export type CreatorShot = z.infer<typeof creatorShotSchema>;

// The library of creator shots (you or the camera in frame) that any spot can pick from.
export const creatorShotsRouter = router({
  // Every creator shot, newest first.
  list: publicProcedure.query(async () => {
    const rows = await getDb()
      .selectFrom("creator_shot as shot")
      .leftJoin("photo_spot as spot", "spot.id", "shot.origin_spot_id")
      .select([
        "shot.id",
        "shot.image_url as imageUrl",
        sql<string>`to_char(shot.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`.as(
          "createdAt",
        ),
        "spot.title as originSpotTitle",
      ])
      .orderBy("shot.created_at", "desc")
      .execute();

    return z.array(creatorShotSchema).parse(rows);
  }),

  // How many spots show this creator shot, for the "remove" sheet.
  usage: publicProcedure.input(z.object({ imageUrl: z.string() })).query(async ({ input }) => {
    const { spotCount } = await getDb()
      .selectFrom("photo_spot_image")
      .select((eb) => eb.fn.count<number>("spot_id").distinct().as("spotCount"))
      .where("kind", "=", "creator")
      .where("image_url", "=", input.imageUrl)
      .executeTakeFirstOrThrow();
    return { spotCount: Number(spotCount) };
  }),

  // Takes a creator shot off every spot and out of the library, then deletes the photo file
  // unless another tab (e.g. a Showcase) still uses the same image.
  deleteEverywhere: publicProcedure
    .input(z.object({ imageUrl: z.string() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const db = getDb();

      await db.transaction().execute(async (trx) => {
        await trx
          .deleteFrom("photo_spot_image")
          .where("kind", "=", "creator")
          .where("image_url", "=", input.imageUrl)
          .execute();
        await trx.deleteFrom("creator_shot").where("image_url", "=", input.imageUrl).execute();
      });

      const stillUsed = await db
        .selectFrom("photo_spot_image")
        .select("id")
        .where("image_url", "=", input.imageUrl)
        .limit(1)
        .executeTakeFirst();
      if (!stillUsed) await deleteSpotPhotoFiles([input.imageUrl]);
    }),

  // Adds freshly uploaded photos to the library, remembering the spot they were uploaded from.
  add: publicProcedure
    .input(
      z.object({
        imageUrls: z
          .array(z.string().refine(isSpotPhotoUrl, "Photos must be uploaded to Vercel Blob."))
          .min(1)
          .max(50),
        originSpotId: z.uuid().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();

      await getDb()
        .insertInto("creator_shot")
        .values(
          input.imageUrls.map((imageUrl) => ({
            image_url: imageUrl,
            origin_spot_id: input.originSpotId,
          })),
        )
        .onConflict((oc) => oc.column("image_url").doNothing())
        .execute();
    }),
});
