DROP POLICY IF EXISTS "Members can view their projects" ON public.projects;
CREATE POLICY "Members and creators can view projects"
ON public.projects FOR SELECT TO authenticated
USING (is_project_member(id, auth.uid()) OR created_by = auth.uid());