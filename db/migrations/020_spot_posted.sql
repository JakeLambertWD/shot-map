-- Spots: whether the spot has been posted yet. The map shows spots that haven't been posted by
-- default. Existing spots start as not posted. Safe to run more than once.

alter table photo_spot add column if not exists posted boolean not null default false;
