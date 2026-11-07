import {
  cleanInstagramUrl,
  isInstagramUrl,
  isUpcomingMediaUrl,
  MAX_UPCOMING_MEDIA,
} from "@/lib/photo-spots";
import { TRPCError } from "@trpc/server";
import { del } from "@vercel/blob";
import { sql } from "kysely";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { assertCanEdit, getDb } from "./spots";

export const UPCOMING_POST_KINDS = ["carousel", "single", "reel"] as const;
export type UpcomingPostKind = (typeof UPCOMING_POST_KINDS)[number];
export const UPCOMING_REEL_TYPES = ["educational", "technique", "bts", "humour", "cinema"] as const;
export type UpcomingReelType = (typeof UPCOMING_REEL_TYPES)[number];

const mediaSchema = z.object({
  id: z.string(),
  mediaUrl: z.string(),
  mediaType: z.enum(["image", "video"]),
  // Videos only: a still frame to show until the video is played.
  posterUrl: z.string().nullable(),
  // Photos only: a small copy for thumbnails. Null if it couldn't be made.
  thumbnailUrl: z.string().nullable(),
  description: z.string(),
  durationSeconds: z.number().nullable(),
  position: z.number(),
});

const postSchema = z.object({
  id: z.string(),
  kind: z.enum(UPCOMING_POST_KINDS),
  title: z.string(),
  caption: z.string(),
  reelType: z.enum(UPCOMING_REEL_TYPES).nullable(),
  instagramUrl: z.string().nullable(),
  spotId: z.string().nullable(),
  spotTitle: z.string().nullable(),
  media: z.array(mediaSchema),
});

export type UpcomingPost = z.infer<typeof postSchema>;
export type UpcomingPostMedia = z.infer<typeof mediaSchema>;

const titleSchema = z.string().trim().min(1, "Give the post a title").max(160);
const captionSchema = z.string().trim().max(2200);
const newMediaSchema = z.object({
  url: z.string().refine(isUpcomingMediaUrl, "Media must be uploaded to Vercel Blob."),
  mediaType: z.enum(["image", "video"]),
  posterUrl: z
    .string()
    .refine(isUpcomingMediaUrl, "Media must be uploaded to Vercel Blob.")
    .nullable(),
  thumbnailUrl: z
    .string()
    .refine(isUpcomingMediaUrl, "Media must be uploaded to Vercel Blob.")
    .nullable(),
  durationSeconds: z.number().int().min(1).max(600).nullable(),
});

function notFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Upcoming post not found." });
}

// Deletes Upcoming Post files from Vercel Blob. The rows are already gone, so a leftover file is
// harmless and never fails the request.
async function deleteMediaFiles(urls: string[]) {
  const blobUrls = urls.filter(isUpcomingMediaUrl);
  if (blobUrls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(blobUrls);
  } catch (error) {
    console.error("Failed to delete upcoming post media from Vercel Blob:", error);
  }
}

const MEDIA_FILE_COLUMNS = ["media_url", "poster_url", "thumbnail_url"] as const;

// Every file behind some media rows: the photo or video, plus a video's poster or a photo's
// thumbnail.
function mediaFileUrls(
  rows: { media_url: string; poster_url: string | null; thumbnail_url: string | null }[],
) {
  return rows.flatMap((row) =>
    [row.media_url, row.poster_url, row.thumbnail_url].filter((url) => url !== null),
  );
}

async function nextMediaPosition(postId: string) {
  const { maxPosition } = await getDb()
    .selectFrom("upcoming_post_media")
    .select((eb) => eb.fn.max("position").as("maxPosition"))
    .where("post_id", "=", postId)
    .executeTakeFirstOrThrow();
  return maxPosition === null ? 0 : Number(maxPosition) + 1;
}

// Photos, carousels and reels waiting to be posted.
export const upcomingPostsRouter = router({
  // Every upcoming post, in the order they've been dragged into (new ones at the top).
  list: publicProcedure.query(async () => {
    const db = getDb();
    const [postRows, mediaRows] = await Promise.all([
      db
        .selectFrom("upcoming_post as post")
        .leftJoin("photo_spot as spot", "spot.id", "post.spot_id")
        .select([
          "post.id",
          "post.kind",
          "post.title",
          "post.caption",
          "post.reel_type as reelType",
          "post.instagram_url as instagramUrl",
          "post.spot_id as spotId",
          "spot.title as spotTitle",
        ])
        .orderBy("post.position")
        .orderBy("post.created_at", "desc")
        .execute(),
      db
        .selectFrom("upcoming_post_media")
        .select([
          "id",
          "post_id as postId",
          "media_url as mediaUrl",
          "media_type as mediaType",
          "poster_url as posterUrl",
          "thumbnail_url as thumbnailUrl",
          "description",
          "duration_seconds as durationSeconds",
          "position",
        ])
        .orderBy("position")
        .orderBy("created_at")
        .execute(),
    ]);

    const mediaByPost = new Map<string, typeof mediaRows>();
    for (const row of mediaRows) {
      mediaByPost.set(row.postId, [...(mediaByPost.get(row.postId) ?? []), row]);
    }

    return z
      .array(postSchema)
      .parse(postRows.map((post) => ({ ...post, media: mediaByPost.get(post.id) ?? [] })));
  }),

  create: publicProcedure
    .input(
      z.object({
        kind: z.enum(UPCOMING_POST_KINDS),
        title: titleSchema,
        caption: captionSchema,
        reelType: z.enum(UPCOMING_REEL_TYPES).nullable(),
        spotId: z.uuid().nullable(),
        media: z.array(newMediaSchema).max(MAX_UPCOMING_MEDIA),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      const id = await getDb()
        .transaction()
        .execute(async (trx) => {
          const post = await trx
            .insertInto("upcoming_post")
            .values({
              kind: input.kind,
              title: input.title,
              caption: input.caption,
              reel_type: input.kind === "reel" ? (input.reelType ?? "bts") : null,
              spot_id: input.spotId,
              // Above every other post.
              position: sql<number>`coalesce((select min(position) from upcoming_post), 0) - 1`,
            })
            .returning("id")
            .executeTakeFirstOrThrow();

          if (input.media.length > 0) {
            await trx
              .insertInto("upcoming_post_media")
              .values(
                input.media.map((media, position) => ({
                  post_id: post.id,
                  media_url: media.url,
                  media_type: media.mediaType,
                  poster_url: media.posterUrl,
                  thumbnail_url: media.thumbnailUrl,
                  duration_seconds: media.durationSeconds,
                  position,
                })),
              )
              .execute();
          }
          return post.id;
        });
      return { id };
    }),

  // Title, caption and spot.
  update: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
        title: titleSchema,
        caption: captionSchema,
        spotId: z.uuid().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      const result = await getDb()
        .updateTable("upcoming_post")
        .set({ title: input.title, caption: input.caption, spot_id: input.spotId })
        .where("id", "=", input.id)
        .executeTakeFirst();
      if (result.numUpdatedRows === BigInt(0)) notFound();
    }),

  // Saves a new order for one tab's posts. They swap the positions they already hold, so posts
  // in the other tab keep their place.
  reorder: publicProcedure
    .input(z.object({ postIds: z.array(z.uuid()).min(1).max(500) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .transaction()
        .execute(async (trx) => {
          const rows = await trx
            .selectFrom("upcoming_post")
            .select("position")
            .where("id", "in", input.postIds)
            .orderBy("position")
            .forUpdate()
            .execute();
          // Also catches a repeated id, which would leave the two lists different lengths.
          if (rows.length !== input.postIds.length) notFound();

          // Raw SQL: Kysely has no builder for unnest, and this updates every post in one query.
          await sql`
            update upcoming_post post
            set position = slots.position
            from unnest(
              ${input.postIds}::uuid[],
              ${rows.map((row) => row.position)}::integer[]
            ) as slots(id, position)
            where post.id = slots.id
          `.execute(trx);
        });
    }),

  setReelType: publicProcedure
    .input(z.object({ id: z.uuid(), reelType: z.enum(UPCOMING_REEL_TYPES) }))
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .updateTable("upcoming_post")
        .set({ reel_type: input.reelType })
        .where("id", "=", input.id)
        .where("kind", "=", "reel")
        .execute();
    }),

  setInstagramUrl: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
        instagramUrl: z
          .string()
          .trim()
          .refine(isInstagramUrl, "Paste a link from instagram.com, like a reel or post.")
          .transform(cleanInstagramUrl)
          .nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .updateTable("upcoming_post")
        .set({ instagram_url: input.instagramUrl })
        .where("id", "=", input.id)
        .execute();
    }),

  // Adds photos or clips to the end of a post.
  addMedia: publicProcedure
    .input(
      z.object({ postId: z.uuid(), media: z.array(newMediaSchema).min(1).max(MAX_UPCOMING_MEDIA) }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      const start = await nextMediaPosition(input.postId);
      await getDb()
        .insertInto("upcoming_post_media")
        .values(
          input.media.map((media, index) => ({
            post_id: input.postId,
            media_url: media.url,
            media_type: media.mediaType,
            poster_url: media.posterUrl,
            thumbnail_url: media.thumbnailUrl,
            duration_seconds: media.durationSeconds,
            position: start + index,
          })),
        )
        .execute();
    }),

  // A reel clip's description and length.
  updateMedia: publicProcedure
    .input(
      z.object({
        id: z.uuid(),
        description: z.string().trim().max(1000),
        durationSeconds: z.number().int().min(1).max(600).nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      assertCanEdit();
      await getDb()
        .updateTable("upcoming_post_media")
        .set({ description: input.description, duration_seconds: input.durationSeconds })
        .where("id", "=", input.id)
        .execute();
    }),

  deleteMedia: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();
    const row = await getDb()
      .deleteFrom("upcoming_post_media")
      .where("id", "=", input.id)
      .returning(MEDIA_FILE_COLUMNS)
      .executeTakeFirst();
    if (row) await deleteMediaFiles(mediaFileUrls([row]));
  }),

  // Deletes a post and its files, e.g. once it's been posted.
  delete: publicProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ input }) => {
    assertCanEdit();
    const db = getDb();
    const media = await db
      .selectFrom("upcoming_post_media")
      .select(MEDIA_FILE_COLUMNS)
      .where("post_id", "=", input.id)
      .execute();
    await db.deleteFrom("upcoming_post").where("id", "=", input.id).execute();
    await deleteMediaFiles(mediaFileUrls(media));
  }),
});
