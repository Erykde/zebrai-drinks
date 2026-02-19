
-- Grant execute back to authenticated so RLS policies work
-- Keep revoked from anon and PUBLIC (prevents unauthenticated RPC calls)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
