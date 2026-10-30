import {
  CAN_EDIT_SPOTS,
  isSpotPhotoUrl,
  MAX_SPOT_PHOTOS,
  MAX_SPOT_TAGS,
  PHOTO_KINDS,
  SPOT_GEAR,
  SPOT_STATUSES,
} from "@/lib/photo-spots";
import { del } from "@vercel/blob";
import { TRPCError } from "@trpc/server";
import { sql, type ExpressionBuilder } from "kysely";
import { z } from "zod";
import { db } from "../db";
import type { DB } from "../db.types";
import { publicProcedure, router } from "../trpc";

const spotSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  postcode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  status: z.enum(SPOT_STATUSES),
  gear: z.enum(SPOT_GEAR),
  tags: z.array(z.string()),
  coverImageUrl: z.string().nullable(),
  photoCount: z.number(),
});

const spotPhotoSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  caption: z.string().nullable(),
  position: z.number(),
  kind: z.enum(PHOTO_KINDS).default("showcase"),
});

// A named set of Showcase photos. id is null for a spot that has no carousel saved yet.
const spotCarouselSchema = z.object({
  id: z.string().nullable(),
  title: z.string(),
  photos: z.array(spotPhotoSchema),
});

export type SpotCarousel = z.infer<typeof spotCarouselSchema>;

const spotDetailSchema = spotSummarySchema.omit({ coverImageUrl: true, photoCount: true }).extend({
  editingNotes: z.string().nullable().optional(),
  // Every Showcase photo, carousel by carousel.
  photos: z.array(spotPhotoSchema),
  carousels: z.array(spotCarouselSchema),
  creatorPhotos: z.array(spotPhotoSchema).default([]),
  editingPhotos: z.array(spotPhotoSchema).default([]),
});

const spotPhotoInputSchema = z.object({
  imageUrl: z.string().refine(isSpotPhotoUrl, "Photos must be uploaded to Vercel Blob."),
  caption: z.string().trim().max(2000),
});

const spotDetailsInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  postcode: z.string().trim().max(10),
  status: z.enum(SPOT_STATUSES),
  gear: z.enum(SPOT_GEAR),
  tags: z.array(z.string().trim().min(1).max(40)).max(MAX_SPOT_TAGS),
});

const createSpotInputSchema = spotDetailsInputSchema.extend({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  photos: z.array(spotPhotoInputSchema).max(MAX_SPOT_PHOTOS),
});

export type CreateSpotInput = z.infer<typeof createSpotInputSchema>;
export type SpotDetailsInput = z.infer<typeof spotDetailsInputSchema>;
export type SpotSummary = z.infer<typeof spotSummarySchema>;
export type SpotDetail = z.infer<typeof spotDetailSchema>;

export function getDb() {
  // Check if the database client is available before querying the database.
  if (!db) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "DATABASE_URL is not configured.",
    });
  }

  return db;
}

export function assertCanEdit() {
  if (!CAN_EDIT_SPOTS) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Editing spots is disabled in production until sign-in is added.",
    });
  }
}

// Photos saved before kinds existed have no kind; they're Showcase photos.
const photoKind = (eb: ExpressionBuilder<DB, "photo_spot_image">) =>
  eb.fn.coalesce("kind", eb.val("showcase"));

// Only files uploaded through the app live in Vercel Blob (not e.g. images in /public).
// Puts each Showcase photo in its carousel. Photos without one go in the first carousel,
// which is a placeholder "Carousel 1" (id null) if the spot has none saved yet.
function groupIntoCarousels<Photo extends { carouselId: string | null }>(
  carouselRows: { id: string; title: string }[],
  photoRows: Photo[],
) {
  const carousels: { id: string | null; title: string; photos: Photo[] }[] = carouselRows.map(
    (row) => ({ id: row.id, title: row.title, photos: [] }),
  );
  if (carousels.length === 0) carousels.push({ id: null, title: "Carousel 1", photos: [] });

  for (const photo of photoRows) {
    const carousel = carousels.find((c) => c.id && c.id === photo.carouselId) ?? carousels[0];
    carousel.photos.push(photo);
  }

  return carousels;
}

// Checks the carousel belongs to the spot, or falls back to the spot's first carousel,
// creating "Carousel 1" if it has none yet.
async function resolveCarouselId(spotId: string, carouselId?: string | null) {
  const db = getDb();

  if (carouselId) {
    const carousel = await db
      .selectFrom("photo_spot_carousel")
      .select("id")
      .where("id", "=", carouselId)
      .where("spot_id", "=", spotId)
      .executeTakeFirst();
    if (!carousel) throw new TRPCError({ code: "NOT_FOUND", message: "Carousel not found." });
    return carouselId;
  }

  const first = await db
    .selectFrom("photo_spot_carousel")
    .select("id")
    .where("spot_id", "=", spotId)
    .orderBy("position")
    .orderBy("created_at")
    .limit(1)
    .executeTakeFirst();
  if (first) return first.id;

  const created = await db
    .insertInto("photo_spot_carousel")
    .columns(["spot_id", "title", "position"])
    .expression((eb) =>
      eb
        .selectFrom("photo_spot")
        .select((eb) => ["id", eb.val("Carousel 1").as("title"), eb.lit(0).as("position")])
        .where("id", "=", spotId),
    )
    .returning("id")
    .executeTakeFirst();
  if (!created) throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
  return created.id;
}

export async function deleteSpotPhotoFiles(imageUrls: string[]) {
  const candidates = imageUrls.filter((url) => isSpotPhotoUrl(url));
  if (candidates.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;

  // Creator shots live on in the shared library after leaving a spot, so never delete their files.
  const libraryRows = await getDb()
    .selectFrom("creator_shot")
    .select("image_url")
    .where("image_url", "in", candidates)
    .execute();
  const inLibrary = new Set(libraryRows.map((row) => row.image_url));
  const blobUrls = candidates.filter((url) => !inLibrary.has(url));
  if (blobUrls.length === 0) return;

  try {
    await del(blobUrls);
  } catch (error) {
    // The database rows are already gone; a leftover file is harmless, so don't fail the request.
    console.error("Failed to delete spot photos from Vercel Blob:", error);
  }
}

export const spotsRouter = router({
  list: publicProcedure.query(async () => {
    // The lateral join picks each spot's first photo to use as its map pin.
    const rows = await getDb()
      .selectFrom("photo_spot as s")
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom("photo_spot_image")
            .select("image_url")
            .whereRef("spot_id", "=", "s.id")
            .where((eb) => eb(photoKind(eb), "=", "showcase"))
            .orderBy("position")
            .limit(1)
            .as("cover"),
        (join) => join.onTrue(),
      )
      .select((eb) => [
        "s.id",
        "s.title",
        "s.postcode",
        "s.latitude",
        "s.longitude",
        "s.status",
        "s.gear",
        "s.tags",
        "cover.image_url as coverImageUrl",
        eb
          .selectFrom("photo_spot_image")
          .select((eb) => eb.cast<number>(eb.fn.countAll(), "integer").as("count"))
          .whereRef("spot_id", "=", "s.id")
          .where((eb) => eb(photoKind(eb), "=", "showcase"))
          .as("photoCount"),
      ])
      .orderBy("s.created_at", "desc")
      .execute();

    return z.array(spotSummarySchema).parse(rows);
  }),

  byId: publicProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const db = getDb();

    const [spot, photoRows, carouselRows] = await Promise.all([
      db
        .selectFrom("photo_spot")
        .select([
          "id",
          "title",
          "editing_notes as editingNotes",
          "postcode",
          "latitude",
          "longitude",
          "status",
          "gear",
          "tags",
        ])
        .where("id", "=", input.id)
        .executeTakeFirst(),
      db
        .selectFrom("photo_spot_image")
        .select((eb) => [
          "id",
          "image_url as imageUrl",
          "caption",
          "position",
          photoKind(eb).as("kind"),
          "carousel_id as carouselId",
        ])
        .where("spot_id", "=", input.id)
        .orderBy("position")
        .execute(),
      db
        .selectFrom("photo_spot_carousel")
        .select(["id", "title"])
        .where("spot_id", "=", input.id)
        .orderBy("position")
        .orderBy("created_at")
        .execute(),
    ]);

    if (!spot) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
    }

    const carousels = groupIntoCarousels(
      carouselRows,
      photoRows.filter((p) => p.kind === "showcase"),
    );
    const photos = carousels.flatMap((carousel) => carousel.photos);
    const creatorPhotos = photoRows.filter((p) => p.kind === "creator");
    const editingPhotos = photoRows.filter((p) => p.kind === "editing");

    return spotDetailSchema.parse({
      ...spot,
      photos,
      carousels,
      creatorPhotos,
      editingPhotos,
    });
  }),

  updatePhotoCaption: publicProcedure
    .input(z.object({ photoId: z.uuid(), caption: z.string().trim().max(2000) }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_image")
        .set({ caption: input.caption || null })
        .where("id", "=", input.photoId)
        .returning("id")
        .executeTakeFirst();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found." });
      }
    }),

  create: publicProcedure.input(createSpotInputSchema).mutation(async ({ input }) => {
    assertCanEdit();

    // Generate the ids up front so the spot, its carousel and its photos can be inserted in one transaction.
    const id = crypto.randomUUID();
    const carouselId = crypto.randomUUID();

    await getDb()
      .transaction()
      .execute(async (trx) => {
        await trx
          .insertInto("photo_spot")
          .values({
            id,
            title: input.title,
            postcode: input.postcode.toUpperCase() || null,
            latitude: input.latitude,
            longitude: input.longitude,
            status: input.status,
            gear: input.gear,
            tags: input.tags,
          })
          .execute();

        await trx
          .insertInto("photo_spot_carousel")
          .values({ id: carouselId, spot_id: id, title: "Carousel 1", position: 0 })
          .execute();

        if (input.photos.length > 0) {
          await trx
            .insertInto("photo_spot_image")
            .values(
              input.photos.map((photo, index) => ({
                spot_id: id,
                image_url: photo.imageUrl,
                caption: photo.caption || null,
                position: index,
                carousel_id: carouselId,
              })),
            )
            .execute();
        }
      });

    return { id };
  }),

  delete: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();
    const db = getDb();

    // Photos are removed by "on delete cascade"; grab their URLs first so the files can go too.
    const photoRows = await db
      .selectFrom("photo_spot_image")
      .select("image_url")
      .where("spot_id", "=", input.id)
      .execute();

    const deleted = await db
      .deleteFrom("photo_spot")
      .where("id", "=", input.id)
      .returning("id")
      .executeTakeFirst();

    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
    }

    // The same file can appear in more than one tab, so delete each one once.
    await deleteSpotPhotoFiles([...new Set(photoRows.map((row) => row.image_url))]);
  }),

  update: publicProcedure
    .input(spotDetailsInputSchema.extend({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot")
        .set({
          title: input.title,
          postcode: input.postcode.toUpperCase() || null,
          status: input.status,
          gear: input.gear,
          tags: input.tags,
        })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
      }
    }),

  // Moves the pin. The postcode is replaced when a new one is found, otherwise kept.
  move: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        postcode: z.string().trim().max(10).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();

      const postcode = input.postcode?.toUpperCase();
      const updated = await getDb()
        .updateTable("photo_spot")
        .set({
          latitude: input.latitude,
          longitude: input.longitude,
          ...(postcode ? { postcode } : {}),
        })
        .where("id", "=", input.id)
        .returning("id")
        .executeTakeFirst();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
      }
    }),

  addPhotos: publicProcedure
    .input(
      z.object({
        spotId: z.uuid(),
        photos: z.array(spotPhotoInputSchema).min(1).max(MAX_SPOT_PHOTOS),
        kind: z.enum(PHOTO_KINDS).default("showcase"),
        // Showcase only: the carousel to add to. Left out, the spot's first carousel is used.
        carouselId: z.uuid().nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      const db = getDb();

      const carouselId =
        input.kind === "showcase" ? await resolveCarouselId(input.spotId, input.carouselId) : null;

      const spot = await db
        .selectFrom("photo_spot")
        .select("id")
        .where("id", "=", input.spotId)
        .executeTakeFirst();
      if (!spot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
      }

      // Showcase photos are limited per carousel; the other tabs per spot.
      const { photoCount } = await db
        .selectFrom("photo_spot_image")
        .select((eb) => eb.fn.countAll().as("photoCount"))
        .$if(carouselId !== null, (qb) => qb.where("carousel_id", "=", carouselId))
        .$if(carouselId === null, (qb) =>
          qb.where("spot_id", "=", input.spotId).where((eb) => eb(photoKind(eb), "=", input.kind)),
        )
        .executeTakeFirstOrThrow();

      if (Number(photoCount) + input.photos.length > MAX_SPOT_PHOTOS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: carouselId
            ? `A carousel can have up to ${MAX_SPOT_PHOTOS} photos.`
            : `A spot can have up to ${MAX_SPOT_PHOTOS} photos in this section.`,
        });
      }

      // New photos go after the existing ones for this kind, in the order they were picked.
      const { maxPosition } = await db
        .selectFrom("photo_spot_image")
        .select((eb) => eb.fn.max("position").as("maxPosition"))
        .where("spot_id", "=", input.spotId)
        .where((eb) => eb(photoKind(eb), "=", input.kind))
        .executeTakeFirstOrThrow();
      const firstPosition = (maxPosition ?? -1) + 1;

      await db
        .insertInto("photo_spot_image")
        .values(
          input.photos.map((photo, index) => ({
            spot_id: input.spotId,
            image_url: photo.imageUrl,
            caption: photo.caption || null,
            position: firstPosition + index,
            kind: input.kind,
            carousel_id: carouselId,
          })),
        )
        .execute();

      // Every creator shot also joins the shared library (already there if picked from it).
      if (input.kind === "creator") {
        await db
          .insertInto("creator_shot")
          .values(
            input.photos.map((photo) => ({
              image_url: photo.imageUrl,
              origin_spot_id: input.spotId,
            })),
          )
          .onConflict((oc) => oc.column("image_url").doNothing())
          .execute();
      }
    }),

  updateEditingNotes: publicProcedure
    .input(z.object({ spotId: z.uuid(), notes: z.string().trim().max(4000) }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot")
        .set({ editing_notes: input.notes || null })
        .where("id", "=", input.spotId)
        .returning("id")
        .executeTakeFirst();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Spot not found." });
      }
    }),

  deletePhoto: publicProcedure
    .input(z.object({ photoId: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      const db = getDb();

      const deleted = await db
        .deleteFrom("photo_spot_image")
        .where("id", "=", input.photoId)
        .returning("image_url")
        .executeTakeFirst();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found." });
      }

      // A Showcase photo can also be used in the Editing tab, so keep the file while it's in use.
      const stillUsed = await db
        .selectFrom("photo_spot_image")
        .select("id")
        .where("image_url", "=", deleted.image_url)
        .limit(1)
        .executeTakeFirst();

      if (!stillUsed) await deleteSpotPhotoFiles([deleted.image_url]);
    }),

  // Saves a new photo order for one tab or carousel: each photo's position becomes its index.
  reorderPhotos: publicProcedure
    .input(
      z.object({
        spotId: z.uuid(),
        photoIds: z.array(z.uuid()).min(1).max(200),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();

      // Raw SQL: Kysely has no builder for unnest, and this updates every photo in one query.
      const { rows } = await sql<{ id: string }>`
        update photo_spot_image photo
        set position = ordered.position
        from unnest(${input.photoIds}::uuid[]) with ordinality as ordered(id, position)
        where photo.id = ordered.id and photo.spot_id = ${input.spotId}
        returning photo.id
      `.execute(getDb());

      if (rows.length !== input.photoIds.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Some photos weren't found." });
      }
    }),

  // The first photo is the map pin, so moving a photo to the front makes it the cover.
  setCoverPhoto: publicProcedure
    .input(z.object({ photoId: z.uuid() }))
    .mutation(async ({ input }) => {
      assertCanEdit();

      const updated = await getDb()
        .updateTable("photo_spot_image as photo")
        .set((eb) => ({
          position: eb
            .selectFrom("photo_spot_image as other")
            .select((eb) => eb(eb.fn.min("other.position"), "-", 1).as("position"))
            .whereRef("other.spot_id", "=", "photo.spot_id"),
        }))
        .where("photo.id", "=", input.photoId)
        .returning("photo.id")
        .executeTakeFirst();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Photo not found." });
      }
    }),
});
