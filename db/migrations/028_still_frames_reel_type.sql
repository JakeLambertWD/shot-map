-- Replaces the Cinema reel type with Still Frames. Existing Cinema reel ideas and Upcoming Posts
-- become Still Frames. Safe to run more than once.

alter table upcoming_post drop constraint if exists upcoming_post_reel_type_check;

update photo_spot_reel set kind = 'still_frames' where kind = 'cinema';
update upcoming_post set reel_type = 'still_frames' where reel_type = 'cinema';

alter table upcoming_post add constraint upcoming_post_reel_type_check
  check (reel_type in ('educational', 'bts', 'humour', 'still_frames', 'location_reveal', 'series'));
