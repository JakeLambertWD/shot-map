-- Photo spots: locations saved on the /maps page, each with its own photos.
-- status is either 'idea' (not shot yet) or 'shot' (already photographed).
-- tags is a list of labels such as 'golden hour' or 'long exposure'.

create table if not exists photo_spot (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  postcode text,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'idea' check (status in ('idea', 'shot')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Each photo belongs to one spot and has its own caption.
-- on delete cascade removes a spot's photos when the spot is deleted.
-- position controls the order photos appear in the carousel.

create table if not exists photo_spot_image (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references photo_spot (id) on delete cascade,
  image_url text not null,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Speeds up loading a spot's photos in carousel order.
create index if not exists photo_spot_image_spot_position_idx
  on photo_spot_image (spot_id, position);
