-- Allow "creator" photos for the Creator Shots tab. Safe to run more than once.

alter table photo_spot_image drop constraint if exists photo_spot_image_kind_check;

alter table photo_spot_image
  add constraint photo_spot_image_kind_check check (kind in ('showcase', 'creator', 'editing'));
