-- Removes the Series reel type. Existing Series reel ideas and Upcoming Posts become Educational.
-- Safe to run more than once.

alter table upcoming_post drop constraint if exists upcoming_post_reel_type_check;

update photo_spot_reel set kind = 'educational' where kind = 'series';
update upcoming_post set reel_type = 'educational' where reel_type = 'series';

alter table upcoming_post add constraint upcoming_post_reel_type_check
  check (reel_type in (
    'educational', 'bts', 'humour', 'still_frames', 'location_reveal', 'showcase'
  ));
