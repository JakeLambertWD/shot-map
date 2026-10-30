-- Reel ideas for a spot, each with a clip-by-clip breakdown. Safe to run more than once.
-- kind leaves room for other reel pillars (educational, 1 clip…) to reuse these tables.

create table if not exists photo_spot_reel (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references photo_spot (id) on delete cascade,
  kind text not null default 'bts',
  title text not null,
  instagram_url text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photo_spot_reel_spot_kind_position_idx
  on photo_spot_reel (spot_id, kind, position);

create table if not exists photo_spot_reel_clip (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references photo_spot_reel (id) on delete cascade,
  description text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 600),
  position integer not null default 0
);

create index if not exists photo_spot_reel_clip_reel_position_idx
  on photo_spot_reel_clip (reel_id, position);
