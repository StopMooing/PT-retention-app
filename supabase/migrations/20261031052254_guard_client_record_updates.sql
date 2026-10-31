-- Applied 31 Oct 2026. Verified: client can change own targets and photo (1 row);
-- client changing own status or pt_id is refused; coach can edit goal, limitations,
-- water and targets (1 row); coach changing user_id is refused; with no signed-in user
-- (signup linking in handle_new_user) the account link can still be set.
--
-- clients had table-level UPDATE for authenticated plus row policies, so a client could
-- change ANY column of their own row (including pt_id, status, goal, notes) and a coach
-- could move a client's pt_id or account link. RLS controls rows, not columns, and both
-- roles are "authenticated", so column grants cannot tell them apart: this trigger does.
--   Client (auth.uid() = user_id): may change only their nutrition targets and photo.
--   Coach (auth.uid() = pt_id): may change anything except id, pt_id, user_id,
--   claim_token, created_at.
--   No signed-in user (auth.uid() is null, e.g. handle_new_user linking a claimed
--   account during signup): unrestricted, as before.
create schema if not exists private;

create or replace function private.guard_client_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_client_cols text[] := array['calorie_target', 'protein_target_g', 'carbs_target_g', 'fats_target_g', 'profile_photo_url'];
  v_identity_cols text[] := array['id', 'pt_id', 'user_id', 'claim_token', 'created_at'];
begin
  if v_uid is null then
    return new;
  end if;

  if (to_jsonb(new) - (array(select jsonb_object_keys(to_jsonb(new)) except select unnest(v_identity_cols))))
     is distinct from
     (to_jsonb(old) - (array(select jsonb_object_keys(to_jsonb(old)) except select unnest(v_identity_cols)))) then
    raise exception 'This change is not allowed: a client''s coach and account link cannot be edited here'
      using errcode = '42501';
  end if;

  if v_uid = old.user_id and v_uid is distinct from old.pt_id then
    if (to_jsonb(new) - v_client_cols) is distinct from (to_jsonb(old) - v_client_cols) then
      raise exception 'Clients can only change their own nutrition targets and profile photo'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_client_update on public.clients;
create trigger guard_client_update
  before update on public.clients
  for each row execute function private.guard_client_update();
