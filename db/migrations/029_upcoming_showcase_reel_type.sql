-- Upcoming Posts: allow the Showcase reel type, as on a spot's Reels tab. Safe to run more than once.

alter table upcoming_post drop constraint if exists upcoming_post_reel_type_check;
alter table upcoming_post add constraint upcoming_post_reel_type_check
  check (reel_type in (
    'educational', 'bts', 'humour', 'still_frames', 'location_reveal', 'series', 'showcase'
  ));
