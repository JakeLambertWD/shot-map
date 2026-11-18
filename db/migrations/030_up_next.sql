-- Up next: spots to shoot in the near future, in the order they'll be shot. Deleting a spot takes
-- it off the list. Safe to run more than once.

create table if not exists photo_spot_up_next (
  spot_id uuid primary key references photo_spot (id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photo_spot_up_next_position_idx on photo_spot_up_next (position);
