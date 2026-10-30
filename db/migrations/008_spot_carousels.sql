-- Showcase photos are grouped into named carousels. Safe to run more than once.

create table if not exists photo_spot_carousel (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references photo_spot (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photo_spot_carousel_spot_position_idx
  on photo_spot_carousel (spot_id, position);

-- Deleting a carousel deletes its photos.
alter table photo_spot_image
  add column if not exists carousel_id uuid references photo_spot_carousel (id) on delete cascade;

-- Every spot's existing Showcase photos become its "Carousel 1".
insert into photo_spot_carousel (spot_id, title, position)
select distinct i.spot_id, 'Carousel 1', 0
from photo_spot_image i
where coalesce(i.kind, 'showcase') = 'showcase'
  and i.carousel_id is null
  and not exists (select 1 from photo_spot_carousel c where c.spot_id = i.spot_id);

update photo_spot_image i
set carousel_id = (
  select c.id
  from photo_spot_carousel c
  where c.spot_id = i.spot_id
  order by c.position, c.created_at
  limit 1
)
where coalesce(i.kind, 'showcase') = 'showcase'
  and i.carousel_id is null;
