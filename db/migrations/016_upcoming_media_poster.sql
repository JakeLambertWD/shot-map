-- Upcoming Posts: a still frame for each video, shown instead of loading the video itself.
-- Videos uploaded before this have no poster and show a placeholder. Safe to run more than once.

alter table upcoming_post_media add column if not exists poster_url text;
