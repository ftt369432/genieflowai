-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Begin transaction
BEGIN;

-- Drop tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.teams;

-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create team_members table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table
CREATE POLICY "Team members can view their teams"
    ON public.teams
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members 
            WHERE team_id = teams.id AND user_id = auth.uid()
        )
        OR auth.uid() = owner_id
    );

CREATE POLICY "Team owners can update their teams"
    ON public.teams
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams"
    ON public.teams
    FOR DELETE
    USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create teams"
    ON public.teams
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Create policies for team_members table
CREATE POLICY "Team members can view team membership"
    ON public.team_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_members.team_id 
            AND (owner_id = auth.uid() OR auth.uid() = team_members.user_id)
        )
    );

CREATE POLICY "Team owners can manage team membership"
    ON public.team_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.teams 
            WHERE id = team_members.team_id 
            AND owner_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for teams table
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- First, drop the problematic policy
DROP POLICY IF EXISTS "team_members_policy" ON team_members;

-- Then create a new non-recursive policy
CREATE POLICY "team_members_policy"
ON team_members
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.role IN ('admin', 'owner')
  )
);

-- You might also need to modify the SELECT policy specifically
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
CREATE POLICY "team_members_select_policy"
ON team_members
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid()
  )
);

-- Commit transaction
COMMIT; 