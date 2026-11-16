-- Reel ideas: the Instagram creator the idea came from, typed in by hand, e.g. "@someone".
-- Safe to run more than once.

alter table photo_spot_reel add column if not exists creator text;
