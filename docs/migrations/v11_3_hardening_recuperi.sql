-- V11.3 · difesa esplicita e indici per le richieste di recupero.

begin;

drop policy if exists "poi_employee_recovery_no_direct_access"
  on public.poi_employee_recovery_requests;

create policy "poi_employee_recovery_no_direct_access"
  on public.poi_employee_recovery_requests
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

create index if not exists poi_employee_recovery_created_by_auth_idx
  on public.poi_employee_recovery_requests(created_by_auth);

create index if not exists poi_employee_recovery_resolved_by_auth_idx
  on public.poi_employee_recovery_requests(resolved_by_auth);

commit;
