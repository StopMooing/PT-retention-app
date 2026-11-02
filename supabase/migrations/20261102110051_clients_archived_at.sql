-- Archive a client: hidden from the coach's lists, their app shows that coaching has
-- ended, and all their history stays. Restoring clears it. Coaches set it on their own
-- clients (the client-record guard lets coaches change it, never the client).
alter table public.clients add column if not exists archived_at timestamptz;
