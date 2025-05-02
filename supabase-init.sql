-- Initial database setup for GenieFlowAI in local Docker development
-- This script will be executed when the Supabase container starts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema if it doesn't exist (for compatibility with Supabase auth)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team pages table
CREATE TABLE IF NOT EXISTS public.team_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team threads table
CREATE TABLE IF NOT EXISTS public.team_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES public.team_pages(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create direct messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team activity table
CREATE TABLE IF NOT EXISTS public.team_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for teams
CREATE POLICY teams_policy ON public.teams 
  USING (id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  ));

-- Create non-recursive policy for team_members (fix infinite recursion issue)
DROP POLICY IF EXISTS team_members_policy ON team_members;
CREATE POLICY team_members_policy ON team_members USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT user_id 
    FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.role IN ('admin', 'owner')
  )
);

-- Create policies for team_pages
CREATE POLICY team_pages_policy ON public.team_pages 
  USING (team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  ));

-- Create policies for team_threads
CREATE POLICY team_threads_policy ON public.team_threads 
  USING (page_id IN (
    SELECT id FROM public.team_pages WHERE team_id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  ));

-- Create policies for direct_messages
CREATE POLICY direct_messages_policy ON public.direct_messages 
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Create policies for team_activity
CREATE POLICY team_activity_policy ON public.team_activity 
  USING (team_id IN (
    SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
  ));

-- Create some seed data (optional)
INSERT INTO public.teams (name, description, avatar)
VALUES 
  ('Development Team', 'Team for software development', '/logos/default.png'),
  ('Marketing Team', 'Team for marketing activities', '/logos/default.png');

-- Add mock users to teams (make sure to replace with your actual user IDs in production)
INSERT INTO public.team_members (team_id, user_id, name, avatar, role)
VALUES 
  ((SELECT id FROM public.teams WHERE name = 'Development Team'), 'mock-user-id', 'Mock User', '/avatars/default.png', 'admin'),
  ((SELECT id FROM public.teams WHERE name = 'Marketing Team'), 'mock-user-id', 'Mock User', '/avatars/default.png', 'owner');