-- Upcoming Posts: a small copy of each photo for the card and sheet thumbnails, so listing posts
-- doesn't download every full-size photo. Videos use their poster instead and leave this null.
-- Photos uploaded before this get one from scripts/backfill-upcoming-thumbnails.mts.
-- Safe to run more than once.

alter table upcoming_post_media add column if not exists thumbnail_url text;
