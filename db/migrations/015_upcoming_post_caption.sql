-- Upcoming Posts: the caption written for a carousel. Safe to run more than once.

alter table upcoming_post add column if not exists caption text not null default '';
