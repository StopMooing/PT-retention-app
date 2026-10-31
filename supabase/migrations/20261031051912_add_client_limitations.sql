-- Applied 31 Oct 2026. The coach's client profile has an "Injuries and limitations" note
-- that had nowhere to save. Plain text, optional.
alter table public.clients add column if not exists limitations text;
