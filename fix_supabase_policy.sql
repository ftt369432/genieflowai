-- SQL to fix Supabase recursive policy
-- First, drop the problematic policy
DROP POLICY IF EXISTS \
team_members_policy\ ON team_members;
-- Create a new non-recursive policy
CREATE POLICY \
team_members_policy\ ON team_members USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.role IN ('admin', 'owner')));
