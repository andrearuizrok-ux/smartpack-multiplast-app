-- Smart Pack · Multiplast V11.3
-- Accessi separati: NOMYRA, account cliente, dipendenti USER + PIN di 6 cifre.

begin;

alter table public.poi_employee_users
  add column if not exists must_change_pin boolean not null default true,
  add column if not exists pin_changed_at timestamptz;

create table if not exists public.poi_employee_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  group_code text not null default 'smartpack-multiplast',
  company_code text not null check (company_code in ('smartpack','multiplast')),
  employee_id uuid references public.poi_employee_users(id) on delete set null,
  request_kind text not null check (request_kind in ('forgot_username','forgot_pin','both')),
  requested_username text,
  identity_hint text not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  created_by_auth uuid references auth.users(id) on delete set null,
  resolved_by_auth uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists poi_employee_recovery_company_status_idx
  on public.poi_employee_recovery_requests(group_code,company_code,status,created_at desc);

create index if not exists poi_employee_recovery_employee_idx
  on public.poi_employee_recovery_requests(employee_id,created_at desc);

alter table public.poi_employee_recovery_requests enable row level security;
revoke all on table public.poi_employee_recovery_requests from public, anon, authenticated;

create or replace function private.poi_can_manage_employees(
  p_group text,
  p_company text default null
)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1
    from public.poi_user_profiles p
    where p.user_id=auth.uid()
      and p.group_code=p_group
      and p.active=true
      and p.account_type in ('platform_admin','backup_admin')
      and (
        p_company is null
        or p.account_type in ('platform_admin','backup_admin')
        or p_company=any(p.company_codes)
      )
  );
$$;

create or replace function private.poi_can_view_employees(
  p_group text,
  p_company text default null
)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select exists(
    select 1
    from public.poi_user_profiles p
    where p.user_id=auth.uid()
      and p.group_code=p_group
      and p.active=true
      and p.account_type in ('platform_admin','backup_admin','tenant_admin')
      and (
        p_company is null
        or p.account_type in ('platform_admin','backup_admin')
        or p_company=any(p.company_codes)
      )
  );
$$;

create or replace function public.poi_employee_create(
  p_company text,
  p_username text,
  p_display_name text,
  p_role_code text,
  p_pin text,
  p_group text default 'smartpack-multiplast'
)
returns uuid
language plpgsql
security definer
set search_path=public,private,extensions,pg_temp
as $$
declare
  v_id uuid;
  v_username text := lower(trim(p_username));
begin
  if auth.uid() is null or not private.poi_can_manage_employees(p_group,p_company) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_company not in ('smartpack','multiplast') then
    raise exception 'invalid_company';
  end if;
  if v_username !~ '^[a-z0-9._-]{3,40}$' then
    raise exception 'invalid_username';
  end if;
  if length(trim(p_display_name)) < 2 or length(trim(p_display_name)) > 100 then
    raise exception 'invalid_display_name';
  end if;
  if (p_company='smartpack' and p_role_code not in ('director','worker','admin'))
     or (p_company='multiplast' and p_role_code not in ('manager','mpworker','admin')) then
    raise exception 'invalid_role';
  end if;
  if p_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin';
  end if;

  insert into public.poi_employee_users(
    group_code,company_code,username,display_name,role_code,pin_hash,
    must_change_pin,pin_changed_at,created_by,updated_by
  ) values (
    p_group,p_company,v_username,trim(p_display_name),p_role_code,
    extensions.crypt(p_pin,extensions.gen_salt('bf',10)),true,null,auth.uid(),auth.uid()
  )
  returning id into v_id;

  insert into public.poi_employee_audit(
    group_code,company_code,employee_id,auth_user_id,action,detail
  ) values (
    p_group,p_company,v_id,auth.uid(),'employee_created',
    jsonb_build_object('username',v_username,'role_code',p_role_code,'first_pin_requires_change',true)
  );

  return v_id;
end;
$$;

create or replace function public.poi_employee_list(
  p_group text default 'smartpack-multiplast',
  p_company text default null
)
returns table(
  id uuid,
  company_code text,
  username text,
  display_name text,
  role_code text,
  active boolean,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path=public,private,pg_temp
as $$
begin
  if auth.uid() is null or not private.poi_can_view_employees(p_group,p_company) then
    raise exception 'not_authorized' using errcode='42501';
  end if;

  return query
    select e.id,e.company_code,e.username,e.display_name,e.role_code,e.active,
           e.locked_until,e.last_login_at,e.created_at,e.updated_at
    from public.poi_employee_users e
    where e.group_code=p_group
      and (p_company is null or e.company_code=p_company)
      and private.poi_can_view_employees(p_group,e.company_code)
    order by e.company_code,e.display_name,e.username;
end;
$$;

create or replace function public.poi_employee_update(
  p_employee_id uuid,
  p_display_name text default null,
  p_role_code text default null,
  p_active boolean default null,
  p_new_pin text default null,
  p_group text default 'smartpack-multiplast'
)
returns boolean
language plpgsql
security definer
set search_path=public,private,extensions,pg_temp
as $$
declare
  v_emp public.poi_employee_users%rowtype;
begin
  select * into v_emp
  from public.poi_employee_users
  where id=p_employee_id and group_code=p_group
  for update;

  if not found then raise exception 'employee_not_found'; end if;
  if auth.uid() is null or not private.poi_can_manage_employees(p_group,v_emp.company_code) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_display_name is not null
     and (length(trim(p_display_name)) < 2 or length(trim(p_display_name)) > 100) then
    raise exception 'invalid_display_name';
  end if;
  if p_role_code is not null and (
    (v_emp.company_code='smartpack' and p_role_code not in ('director','worker','admin'))
    or (v_emp.company_code='multiplast' and p_role_code not in ('manager','mpworker','admin'))
  ) then
    raise exception 'invalid_role';
  end if;
  if p_new_pin is not null and p_new_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin';
  end if;

  update public.poi_employee_users set
    display_name=coalesce(trim(p_display_name),display_name),
    role_code=coalesce(p_role_code,role_code),
    active=coalesce(p_active,active),
    pin_hash=case
      when p_new_pin is null then pin_hash
      else extensions.crypt(p_new_pin,extensions.gen_salt('bf',10))
    end,
    must_change_pin=case when p_new_pin is null then must_change_pin else true end,
    pin_changed_at=case when p_new_pin is null then pin_changed_at else null end,
    failed_attempts=case
      when p_new_pin is not null or p_active is true then 0
      else failed_attempts
    end,
    locked_until=case
      when p_new_pin is not null or p_active is true then null
      else locked_until
    end,
    updated_by=auth.uid(),
    updated_at=now()
  where id=p_employee_id;

  insert into public.poi_employee_audit(
    group_code,company_code,employee_id,auth_user_id,action,detail
  ) values (
    p_group,v_emp.company_code,p_employee_id,auth.uid(),'employee_updated',
    jsonb_strip_nulls(jsonb_build_object(
      'display_name',p_display_name,
      'role_code',p_role_code,
      'active',p_active,
      'pin_reset',p_new_pin is not null,
      'pin_requires_change',case when p_new_pin is null then null else true end
    ))
  );

  return true;
end;
$$;

drop function if exists public.poi_verify_employee_pin(text,text,text,text);

create function public.poi_verify_employee_pin(
  p_username text,
  p_pin text,
  p_company text,
  p_group text default 'smartpack-multiplast'
)
returns table(
  success boolean,
  error_code text,
  employee_id uuid,
  username text,
  display_name text,
  role_code text,
  company_code text,
  must_change_pin boolean
)
language plpgsql
security definer
set search_path=public,private,extensions,pg_temp
as $$
declare
  v_emp public.poi_employee_users%rowtype;
  v_next_attempts integer;
begin
  if auth.uid() is null or not private.poi_is_member(p_group) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_company not in ('smartpack','multiplast') then
    raise exception 'invalid_company';
  end if;
  if not exists(
    select 1
    from public.poi_user_profiles p
    where p.user_id=auth.uid()
      and p.group_code=p_group
      and p.active=true
      and (p_company=any(p.company_codes) or p.account_type in ('platform_admin','backup_admin'))
  ) then
    raise exception 'company_not_authorized' using errcode='42501';
  end if;

  select * into v_emp
  from public.poi_employee_users e
  where e.group_code=p_group
    and e.company_code=p_company
    and e.username=lower(trim(p_username))
  for update;

  if not found or not v_emp.active or p_pin !~ '^[0-9]{6}$' then
    return query select false,'invalid_credentials',null::uuid,null::text,null::text,
      null::text,null::text,null::boolean;
    return;
  end if;

  if v_emp.locked_until is not null and v_emp.locked_until > now() then
    return query select false,'locked',v_emp.id,v_emp.username,v_emp.display_name,
      v_emp.role_code,v_emp.company_code,v_emp.must_change_pin;
    return;
  end if;

  if v_emp.pin_hash=extensions.crypt(p_pin,v_emp.pin_hash) then
    update public.poi_employee_users
    set failed_attempts=0,locked_until=null,last_login_at=now(),updated_at=now()
    where id=v_emp.id;

    insert into public.poi_employee_audit(
      group_code,company_code,employee_id,auth_user_id,action,detail
    ) values (
      p_group,p_company,v_emp.id,auth.uid(),'employee_login',
      jsonb_build_object('username',v_emp.username)
    );

    return query select true,null::text,v_emp.id,v_emp.username,v_emp.display_name,
      v_emp.role_code,v_emp.company_code,v_emp.must_change_pin;
  else
    v_next_attempts=least(5,v_emp.failed_attempts+1);
    update public.poi_employee_users
    set failed_attempts=v_next_attempts,
        locked_until=case when v_next_attempts>=5 then now()+interval '15 minutes' else null end,
        updated_at=now()
    where id=v_emp.id;

    insert into public.poi_employee_audit(
      group_code,company_code,employee_id,auth_user_id,action,detail
    ) values (
      p_group,p_company,v_emp.id,auth.uid(),'employee_login_failed',
      jsonb_build_object('username',v_emp.username,'attempts',v_next_attempts)
    );

    return query select false,
      case when v_next_attempts>=5 then 'locked' else 'invalid_credentials' end,
      v_emp.id,v_emp.username,v_emp.display_name,v_emp.role_code,v_emp.company_code,
      v_emp.must_change_pin;
  end if;
end;
$$;

create or replace function public.poi_employee_change_pin(
  p_employee_id uuid,
  p_current_pin text,
  p_new_pin text,
  p_group text default 'smartpack-multiplast'
)
returns boolean
language plpgsql
security definer
set search_path=public,private,extensions,pg_temp
as $$
declare
  v_emp public.poi_employee_users%rowtype;
  v_next_attempts integer;
begin
  if auth.uid() is null or not private.poi_is_member(p_group) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_current_pin !~ '^[0-9]{6}$' or p_new_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin';
  end if;
  if p_current_pin=p_new_pin then
    raise exception 'pin_must_change';
  end if;

  select * into v_emp
  from public.poi_employee_users
  where id=p_employee_id and group_code=p_group
  for update;

  if not found or not v_emp.active then
    raise exception 'employee_not_found';
  end if;
  if not exists(
    select 1
    from public.poi_user_profiles p
    where p.user_id=auth.uid()
      and p.group_code=p_group
      and p.active=true
      and (v_emp.company_code=any(p.company_codes) or p.account_type in ('platform_admin','backup_admin'))
  ) then
    raise exception 'company_not_authorized' using errcode='42501';
  end if;
  if v_emp.locked_until is not null and v_emp.locked_until>now() then
    raise exception 'employee_locked';
  end if;

  if v_emp.pin_hash<>extensions.crypt(p_current_pin,v_emp.pin_hash) then
    v_next_attempts=least(5,v_emp.failed_attempts+1);
    update public.poi_employee_users
    set failed_attempts=v_next_attempts,
        locked_until=case when v_next_attempts>=5 then now()+interval '15 minutes' else null end,
        updated_at=now()
    where id=v_emp.id;
    insert into public.poi_employee_audit(
      group_code,company_code,employee_id,auth_user_id,action,detail
    ) values (
      p_group,v_emp.company_code,v_emp.id,auth.uid(),'employee_pin_change_failed',
      jsonb_build_object('attempts',v_next_attempts)
    );
    return false;
  end if;

  update public.poi_employee_users
  set pin_hash=extensions.crypt(p_new_pin,extensions.gen_salt('bf',10)),
      must_change_pin=false,
      pin_changed_at=now(),
      failed_attempts=0,
      locked_until=null,
      updated_by=auth.uid(),
      updated_at=now()
  where id=v_emp.id;

  insert into public.poi_employee_audit(
    group_code,company_code,employee_id,auth_user_id,action,detail
  ) values (
    p_group,v_emp.company_code,v_emp.id,auth.uid(),'employee_pin_changed','{}'::jsonb
  );

  return true;
end;
$$;

create or replace function public.poi_employee_recovery_create(
  p_company text,
  p_request_kind text,
  p_username text default null,
  p_identity_hint text default null,
  p_note text default null,
  p_group text default 'smartpack-multiplast'
)
returns uuid
language plpgsql
security definer
set search_path=public,private,pg_temp
as $$
declare
  v_id uuid;
  v_employee_id uuid;
  v_username text := nullif(lower(trim(coalesce(p_username,''))), '');
begin
  if auth.uid() is null or not private.poi_is_member(p_group) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_company not in ('smartpack','multiplast') then raise exception 'invalid_company'; end if;
  if p_request_kind not in ('forgot_username','forgot_pin','both') then
    raise exception 'invalid_request_kind';
  end if;
  if length(trim(coalesce(p_identity_hint,''))) not between 2 and 120 then
    raise exception 'invalid_identity_hint';
  end if;
  if length(coalesce(p_note,''))>500 then raise exception 'note_too_long'; end if;
  if v_username is not null and v_username !~ '^[a-z0-9._-]{3,40}$' then
    raise exception 'invalid_username';
  end if;
  if not exists(
    select 1
    from public.poi_user_profiles p
    where p.user_id=auth.uid()
      and p.group_code=p_group
      and p.active=true
      and (p_company=any(p.company_codes) or p.account_type in ('platform_admin','backup_admin'))
  ) then
    raise exception 'company_not_authorized' using errcode='42501';
  end if;
  if (
    select count(*)
    from public.poi_employee_recovery_requests r
    where r.created_by_auth=auth.uid()
      and r.created_at>now()-interval '15 minutes'
  )>=8 then
    raise exception 'too_many_requests';
  end if;

  if v_username is not null then
    select e.id into v_employee_id
    from public.poi_employee_users e
    where e.group_code=p_group
      and e.company_code=p_company
      and e.username=v_username
      and e.active=true
    limit 1;
  end if;

  insert into public.poi_employee_recovery_requests(
    group_code,company_code,employee_id,request_kind,requested_username,
    identity_hint,note,created_by_auth
  ) values (
    p_group,p_company,v_employee_id,p_request_kind,v_username,
    trim(p_identity_hint),trim(coalesce(p_note,'')),auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.poi_employee_recovery_list(
  p_group text default 'smartpack-multiplast',
  p_company text default null
)
returns table(
  id uuid,
  company_code text,
  request_kind text,
  requested_username text,
  identity_hint text,
  note text,
  status text,
  employee_id uuid,
  employee_username text,
  employee_display_name text,
  created_at timestamptz,
  resolved_at timestamptz
)
language plpgsql
stable
security definer
set search_path=public,private,pg_temp
as $$
begin
  if auth.uid() is null or not private.poi_can_view_employees(p_group,p_company) then
    raise exception 'not_authorized' using errcode='42501';
  end if;

  return query
    select r.id,r.company_code,r.request_kind,r.requested_username,r.identity_hint,
           r.note,r.status,r.employee_id,e.username,e.display_name,r.created_at,r.resolved_at
    from public.poi_employee_recovery_requests r
    left join public.poi_employee_users e on e.id=r.employee_id
    where r.group_code=p_group
      and (p_company is null or r.company_code=p_company)
      and private.poi_can_view_employees(p_group,r.company_code)
    order by (r.status='pending') desc,r.created_at desc;
end;
$$;

create or replace function public.poi_employee_recovery_resolve(
  p_request_id uuid,
  p_employee_id uuid default null,
  p_new_pin text default null,
  p_status text default 'resolved',
  p_group text default 'smartpack-multiplast'
)
returns table(username text,display_name text,request_kind text)
language plpgsql
security definer
set search_path=public,private,extensions,pg_temp
as $$
declare
  v_req public.poi_employee_recovery_requests%rowtype;
  v_emp public.poi_employee_users%rowtype;
  v_target uuid;
begin
  select * into v_req
  from public.poi_employee_recovery_requests
  where id=p_request_id and group_code=p_group
  for update;

  if not found then raise exception 'request_not_found'; end if;
  if auth.uid() is null or not private.poi_can_view_employees(p_group,v_req.company_code) then
    raise exception 'not_authorized' using errcode='42501';
  end if;
  if p_status not in ('resolved','dismissed') then raise exception 'invalid_status'; end if;

  if p_status='dismissed' then
    update public.poi_employee_recovery_requests
    set status='dismissed',resolved_by_auth=auth.uid(),resolved_at=now(),updated_at=now()
    where id=v_req.id;
    return;
  end if;

  v_target:=coalesce(p_employee_id,v_req.employee_id);
  if v_target is null then raise exception 'employee_required'; end if;

  select * into v_emp
  from public.poi_employee_users
  where id=v_target
    and group_code=p_group
    and company_code=v_req.company_code
    and active=true
  for update;

  if not found then raise exception 'employee_not_found'; end if;

  if v_req.request_kind in ('forgot_pin','both') then
    if p_new_pin is null or p_new_pin !~ '^[0-9]{6}$' then
      raise exception 'invalid_pin';
    end if;
    update public.poi_employee_users
    set pin_hash=extensions.crypt(p_new_pin,extensions.gen_salt('bf',10)),
        must_change_pin=true,
        pin_changed_at=null,
        failed_attempts=0,
        locked_until=null,
        updated_by=auth.uid(),
        updated_at=now()
    where id=v_emp.id;
  end if;

  update public.poi_employee_recovery_requests
  set employee_id=v_emp.id,status='resolved',resolved_by_auth=auth.uid(),
      resolved_at=now(),updated_at=now()
  where id=v_req.id;

  insert into public.poi_employee_audit(
    group_code,company_code,employee_id,auth_user_id,action,detail
  ) values (
    p_group,v_emp.company_code,v_emp.id,auth.uid(),'employee_recovery_resolved',
    jsonb_build_object('request_id',v_req.id,'request_kind',v_req.request_kind,
      'pin_reset',v_req.request_kind in ('forgot_pin','both'))
  );

  return query select v_emp.username,v_emp.display_name,v_req.request_kind;
end;
$$;

revoke execute on function private.poi_can_manage_employees(text,text) from public,anon,authenticated;
revoke execute on function private.poi_can_view_employees(text,text) from public,anon,authenticated;

revoke execute on function public.poi_employee_create(text,text,text,text,text,text) from public,anon;
revoke execute on function public.poi_employee_list(text,text) from public,anon;
revoke execute on function public.poi_employee_update(uuid,text,text,boolean,text,text) from public,anon;
revoke execute on function public.poi_verify_employee_pin(text,text,text,text) from public,anon;
revoke execute on function public.poi_employee_change_pin(uuid,text,text,text) from public,anon;
revoke execute on function public.poi_employee_recovery_create(text,text,text,text,text,text) from public,anon;
revoke execute on function public.poi_employee_recovery_list(text,text) from public,anon;
revoke execute on function public.poi_employee_recovery_resolve(uuid,uuid,text,text,text) from public,anon;

grant execute on function public.poi_employee_create(text,text,text,text,text,text) to authenticated;
grant execute on function public.poi_employee_list(text,text) to authenticated;
grant execute on function public.poi_employee_update(uuid,text,text,boolean,text,text) to authenticated;
grant execute on function public.poi_verify_employee_pin(text,text,text,text) to authenticated;
grant execute on function public.poi_employee_change_pin(uuid,text,text,text) to authenticated;
grant execute on function public.poi_employee_recovery_create(text,text,text,text,text,text) to authenticated;
grant execute on function public.poi_employee_recovery_list(text,text) to authenticated;
grant execute on function public.poi_employee_recovery_resolve(uuid,uuid,text,text,text) to authenticated;

commit;
