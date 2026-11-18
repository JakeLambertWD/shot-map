-- Removes the 1 Clip ('technique') reel type. Existing 1 Clip reel ideas and Upcoming Posts become
-- Educational. Safe to run more than once.

update photo_spot_reel set kind = 'educational' where kind = 'technique';
update upcoming_post set reel_type = 'educational' where reel_type = 'technique';

alter table upcoming_post drop constraint if exists upcoming_post_reel_type_check;
alter table upcoming_post add constraint upcoming_post_reel_type_check
  check (reel_type in ('educational', 'bts', 'humour', 'cinema', 'location_reveal', 'series'));
