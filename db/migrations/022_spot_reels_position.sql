-- Spots: a saved order for the Reels page, so spots can be dragged into place. Spots that already
-- have reels keep their newest-first order; spots without a position yet (null) go to the top.
-- Safe to run more than once.

alter table photo_spot add column if not exists reels_position integer;

update photo_spot spot
set reels_position = ordered.position
from (
  select id, (row_number() over (order by created_at desc) - 1)::integer as position
  from photo_spot s
  where exists (select 1 from photo_spot_reel r where r.spot_id = s.id and r.kind != 'pov')
) ordered
where spot.id = ordered.id and spot.reels_position is null;
