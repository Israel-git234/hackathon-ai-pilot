create or replace function public.get_invite_preview(_code text)
returns table(project_id uuid, project_name text, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name,
    (select count(*) from public.project_members pm where pm.project_id = p.id)
  from public.projects p
  where p.invite_code = _code and p.archived = false
  limit 1;
$$;

create or replace function public.join_project_by_invite(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _project_id uuid;
begin
  select id into _project_id from public.projects
  where invite_code = _code and archived = false;

  if _project_id is null then
    raise exception 'Invalid or expired invite code';
  end if;

  if not exists (
    select 1 from public.project_members
    where project_id = _project_id and user_id = auth.uid()
  ) then
    insert into public.project_members (project_id, user_id, member_role)
    values (_project_id, auth.uid(), 'member');
  end if;

  return _project_id;
end;
$$;

grant execute on function public.get_invite_preview(text) to authenticated;
grant execute on function public.join_project_by_invite(text) to authenticated;