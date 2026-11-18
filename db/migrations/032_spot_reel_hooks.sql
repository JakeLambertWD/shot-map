-- Reel ideas: alternative hooks to try, in order, alongside the reel's name (its main hook).
-- Existing ideas start with none. Safe to run more than once.

alter table photo_spot_reel add column if not exists hooks text[] not null default '{}';
