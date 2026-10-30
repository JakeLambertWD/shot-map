-- Upcoming Posts: content captured at spots and waiting to be posted, listed by planned date.
-- Safe to run more than once.

create table if not exists upcoming_post (
  id uuid primary key default gen_random_uuid(),
  -- 'carousel', 'single' (one photo) or 'reel'.
  kind text not null check (kind in ('carousel', 'single', 'reel')),
  title text not null,
  -- Reels only: 'educational', 'technique' (1 Clip) or 'bts', as on a spot's Reels tab.
  reel_type text check (reel_type in ('educational', 'technique', 'bts')),
  -- Reels only: an Instagram reel to take inspiration from.
  instagram_url text,
  spot_id uuid references photo_spot (id) on delete set null,
  post_date date,
  created_at timestamptz not null default now()
);

create index if not exists upcoming_post_date_idx on upcoming_post (post_date);

-- The photos of a carousel or single post, or the clips of a reel, in order.
create table if not exists upcoming_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references upcoming_post (id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  -- Reel clips: what happens in the clip, and how long it is.
  description text not null default '',
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 600),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists upcoming_post_media_post_position_idx
  on upcoming_post_media (post_id, position);
