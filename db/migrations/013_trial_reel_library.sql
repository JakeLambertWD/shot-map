-- Trial Reels become one library of Instagram links shared by every spot (like creator shots).
-- A spot shows the links picked for it; removing one from a spot leaves it in the library.
-- Moves any links saved under 012 into the library. Safe to run more than once.

create table if not exists trial_reel (
  id uuid primary key default gen_random_uuid(),
  instagram_url text not null unique,
  -- Typed in by hand, e.g. "@someone"; Instagram doesn't share it with the link.
  creator text,
  created_at timestamptz not null default now()
);

create index if not exists trial_reel_created_at_idx on trial_reel (created_at desc);

do $$
begin
  -- 012 stored each link on its spot. Turn that table into the list of picks.
  if exists (
    select 1 from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'photo_spot_trial_reel'
      and column_name = 'instagram_url'
  ) then
    create temp table old_trial_reel on commit drop as select * from photo_spot_trial_reel;
    drop table photo_spot_trial_reel;

    insert into trial_reel (instagram_url, creator, created_at)
    select instagram_url, max(creator), min(created_at)
    from old_trial_reel
    group by instagram_url
    on conflict (instagram_url) do nothing;

    create table photo_spot_trial_reel (
      spot_id uuid not null references photo_spot (id) on delete cascade,
      trial_reel_id uuid not null references trial_reel (id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (spot_id, trial_reel_id)
    );

    insert into photo_spot_trial_reel (spot_id, trial_reel_id, created_at)
    select old.spot_id, reel.id, min(old.created_at)
    from old_trial_reel old
    join trial_reel reel on reel.instagram_url = old.instagram_url
    group by old.spot_id, reel.id;
  end if;
end $$;

create table if not exists photo_spot_trial_reel (
  spot_id uuid not null references photo_spot (id) on delete cascade,
  trial_reel_id uuid not null references trial_reel (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (spot_id, trial_reel_id)
);

create index if not exists photo_spot_trial_reel_reel_idx on photo_spot_trial_reel (trial_reel_id);
