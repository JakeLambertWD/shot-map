-- Spot status: 'planning' (still working out the shot) or 'ready_to_shoot'.
-- Replaces the old 'idea' / 'shot' values from 002. Safe to run more than once.

-- Drop the old check so the column can hold the new values.
alter table photo_spot drop constraint if exists photo_spot_status_check;

-- Existing spots (including any saved as 'in_progress') start as planning.
update photo_spot
set status = 'planning'
where status not in ('planning', 'ready_to_shoot');

alter table photo_spot alter column status set default 'planning';

alter table photo_spot
  add constraint photo_spot_status_check check (status in ('planning', 'ready_to_shoot'));
