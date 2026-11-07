-- Upcoming Posts: a saved order, so posts can be dragged into place. Existing posts keep their
-- newest-first order; new posts go to the top. Safe to run more than once.

alter table upcoming_post add column if not exists position integer;

update upcoming_post post
set position = ordered.position
from (
  select id, (row_number() over (order by created_at desc) - 1)::integer as position
  from upcoming_post
) ordered
where post.id = ordered.id and post.position is null;

alter table upcoming_post alter column position set default 0;
alter table upcoming_post alter column position set not null;
