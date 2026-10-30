-- Trial Reels: Instagram links to video ideas, shown as a grid on a spot. Safe to run more than once.
-- The older "pov" reel ideas in photo_spot_reel are left as they are.

create table if not exists photo_spot_trial_reel (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references photo_spot (id) on delete cascade,
  instagram_url text not null,
  -- Typed in by hand, e.g. "@someone"; Instagram doesn't share it with the link.
  creator text,
  created_at timestamptz not null default now()
);

create index if not exists photo_spot_trial_reel_spot_created_idx
  on photo_spot_trial_reel (spot_id, created_at desc);
