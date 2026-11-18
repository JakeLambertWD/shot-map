-- Carousels: an optional Instagram link for inspo, as reel ideas have. Safe to run more than once.

alter table photo_spot_carousel add column if not exists instagram_url text;
