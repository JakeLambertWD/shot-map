-- Reel clips: the text shown on screen during the clip, and how to film it.
-- Safe to run more than once.

alter table photo_spot_reel_clip add column if not exists on_screen_text text;
alter table photo_spot_reel_clip add column if not exists how_to_film text;
