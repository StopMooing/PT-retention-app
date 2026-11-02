-- Follow-up to claim_with_existing_account: that migration replaced public.guard_client_update,
-- but the trigger on clients uses private.guard_client_update. Same body, right schema.
-- (public.guard_client_update is unused: no trigger calls it, and trigger functions can't be
-- called over the API. Drop it in a later SQL Editor batch.)

create or replace function private.guard_client_update()
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

