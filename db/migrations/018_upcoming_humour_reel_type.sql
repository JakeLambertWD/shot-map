-- Upcoming Posts: allow the Humour reel type, as on a spot's Reels tab. Safe to run more than once.

alter table upcoming_post drop constraint if exists upcoming_post_reel_type_check;
alter table upcoming_post add constraint upcoming_post_reel_type_check
  check (reel_type in ('educational', 'technique', 'bts', 'humour'));
