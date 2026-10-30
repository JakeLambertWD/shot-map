-- Support editing tutorial photos and notes on spots. Safe to run more than once.

alter table photo_spot add column if not exists editing_notes text;

alter table photo_spot_image add column if not exists kind text not null default 'showcase';

alter table photo_spot_image drop constraint if exists photo_spot_image_kind_check;

alter table photo_spot_image
  add constraint photo_spot_image_kind_check check (kind in ('showcase', 'editing'));

create index if not exists photo_spot_image_spot_kind_position_idx
  on photo_spot_image (spot_id, kind, position);
