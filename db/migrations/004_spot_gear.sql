-- What a spot will be shot with: 'camera' (default) or 'drone'. Safe to run more than once.

alter table photo_spot add column if not exists gear text not null default 'camera';

alter table photo_spot drop constraint if exists photo_spot_gear_check;

alter table photo_spot
  add constraint photo_spot_gear_check check (gear in ('camera', 'drone'));
