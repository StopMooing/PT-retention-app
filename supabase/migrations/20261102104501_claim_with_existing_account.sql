-- A client whose email already has an account could never use their invite link:
-- signup said "already registered", and signing in never links them (only signup does,
-- in handle_new_user). claim_client_with_account links the signed-in account to the
-- invite, only when the account's email is the invite's email, the invite is unused and
-- the account isn't already a client somewhere. An account opened by mistake as a coach
-- (no clients of its own) becomes a client account.

-- The client-record guard blocks any change to user_id. Let this one function through.
-- (Wrong schema: the trigger uses private.guard_client_update. Fixed in the next migration.)
create or replace function public.guard_client_update()
returns trigger language plpgsql
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

  -- claim_client_with_account links an invite to the caller's own account.
  if current_setting('unfnshd.claiming', true) = 'on'
     and old.user_id is null and new.user_id = v_uid
     and (to_jsonb(new) - 'user_id') = (to_jsonb(old) - 'user_id') then
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

create or replace function public.claim_client_with_account(p_token uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_client_id uuid;
  v_client_email text;
begin
  if v_uid is null then return 'not_signed_in'; end if;
  select u.email into v_email from auth.users u where u.id = v_uid;
  select c.id, c.email into v_client_id, v_client_email
    from public.clients c where c.claim_token = p_token and c.user_id is null;
  if v_client_id is null then return 'invalid_link'; end if;
  if lower(trim(coalesce(v_client_email, ''))) <> lower(trim(coalesce(v_email, ''))) then return 'email_mismatch'; end if;
  if exists (select 1 from public.clients c where c.user_id = v_uid) then return 'already_linked'; end if;

  perform set_config('unfnshd.claiming', 'on', true);
  update public.clients set user_id = v_uid where id = v_client_id and user_id is null;
  perform set_config('unfnshd.claiming', 'off', true);

  update public.profiles p set role = 'client'
   where p.id = v_uid and p.role is distinct from 'client'
     and not exists (select 1 from public.clients c where c.pt_id = v_uid);
  return 'linked';
end;
$$;
