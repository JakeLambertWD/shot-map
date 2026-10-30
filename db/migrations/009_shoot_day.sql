-- Today's shoot: spots shortlisted for a given day, in route order. Safe to run more than once.

create table if not exists photo_shoot_day_spot (
  id uuid primary key default gen_random_uuid(),
  shoot_date date not null,
  spot_id uuid not null references photo_spot (id) on delete cascade,
  position integer not null default 0,
  shot_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shoot_date, spot_id)
);

create index if not exists photo_shoot_day_spot_date_position_idx
  on photo_shoot_day_spot (shoot_date, position);
