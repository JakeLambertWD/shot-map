-- Reel ideas: whether the idea is planned and ready to shoot. Existing ideas start as not ready.
-- Safe to run more than once.

alter table photo_spot_reel add column if not exists ready boolean not null default false;
