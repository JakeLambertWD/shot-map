-- One library of creator shots shared by every spot. Safe to run more than once.
-- A spot shows a library shot by having a 'creator' photo_spot_image row with the same image_url,
-- which keeps that spot's own note and order. Removing it from a spot leaves it in the library.

create table if not exists creator_shot (
  id uuid primary key default gen_random_uuid(),
  image_url text not null unique,
  -- The spot it was first uploaded for, shown as "Taken at …". Kept if that spot is deleted.
  origin_spot_id uuid references photo_spot(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists creator_shot_created_at_idx on creator_shot (created_at desc);

-- Every creator shot uploaded so far joins the library, dated from its first upload.
insert into creator_shot (image_url, origin_spot_id, created_at)
select distinct on (image_url) image_url, spot_id, created_at
from photo_spot_image
where kind = 'creator'
order by image_url, created_at
on conflict (image_url) do nothing;
