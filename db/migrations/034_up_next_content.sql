-- What each Up next spot is being shot for: a reel, a carousel, or both. Existing spots become
-- both. Safe to run more than once.

alter table photo_spot_up_next add column if not exists content text not null default 'both';

alter table photo_spot_up_next drop constraint if exists photo_spot_up_next_content_check;

alter table photo_spot_up_next add constraint photo_spot_up_next_content_check
  check (content in ('reel', 'carousel', 'both'));
