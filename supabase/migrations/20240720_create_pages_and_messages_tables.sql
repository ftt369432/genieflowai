-- supabase/migrations/YYYYMMDD_create_pages_and_messages_tables.sql

-- Begin transaction
BEGIN;

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create 'pages' table (for channels)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Ensures creator is tracked, page remains if user is deleted
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to pages table
COMMENT ON TABLE public.pages IS 'Stores pages (channels) belonging to teams.';

-- 2. Create 'messages' table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Message remains if user is deleted, but links to user
    content TEXT NOT NULL,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE, -- For threaded messages
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to messages table
COMMENT ON TABLE public.messages IS 'Stores messages within pages/channels, supports threading.';

-- 3. Create 'page_members' table (for explicit membership to pages, especially private ones)
CREATE TABLE IF NOT EXISTS public.page_members (
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- e.g., 'member', 'admin_of_page'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (page_id, user_id)
);

-- Add comment to page_members table
COMMENT ON TABLE public.page_members IS 'Manages user membership and roles for specific pages (channels).';

-- 4. Triggers for 'updated_at' timestamp
-- (Assuming update_updated_at_column() function already exists from previous migrations)

CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Row Level Security (RLS)

-- Enable RLS for new tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR 'pages' TABLE

-- Allow team members to SELECT pages of their teams if the page is not private.
-- If private, they must be a member of the page via page_members.
CREATE POLICY "Team members can view pages in their teams" 
    ON public.pages 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = pages.team_id AND tm.user_id = auth.uid()
        )
        AND (
            NOT pages.is_private 
            OR EXISTS (
                SELECT 1 FROM public.page_members pm 
                WHERE pm.page_id = pages.id AND pm.user_id = auth.uid()
            )
        )
    );

-- Allow team members to INSERT new pages into their teams.
-- The creator automatically becomes a member of the page if is_private is true, handled by application logic or another trigger.
CREATE POLICY "Team members can create pages in their teams" 
    ON public.pages 
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = pages.team_id AND tm.user_id = auth.uid()
        )
        AND pages.created_by = auth.uid()
    );

-- Allow page creator or team owner to UPDATE pages.
CREATE POLICY "Page creator or team owner can update pages" 
    ON public.pages 
    FOR UPDATE
    USING (
        pages.created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = pages.team_id AND t.owner_id = auth.uid()
        )
    );

-- Allow page creator or team owner to DELETE pages.
CREATE POLICY "Page creator or team owner can delete pages" 
    ON public.pages 
    FOR DELETE
    USING (
        pages.created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = pages.team_id AND t.owner_id = auth.uid()
        )
    );


-- POLICIES FOR 'messages' TABLE

-- Allow users to SELECT messages in pages they have access to.
CREATE POLICY "Users can view messages in accessible pages" 
    ON public.messages 
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = messages.page_id
            -- This re-uses the page SELECT policy logic implicitly by checking if the user can select the page
            -- Ensure the SELECT policy on 'pages' is sufficient or replicate its logic here.
            -- For simplicity here, we check if they are a member of the team and if the page is not private, or if they are a page_member.
            AND EXISTS (
                SELECT 1 FROM public.team_members tm
                WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()
            )
            AND (
                NOT p.is_private 
                OR EXISTS (
                    SELECT 1 FROM public.page_members pm 
                    WHERE pm.page_id = p.id AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Allow users to INSERT messages into pages they have access to.
CREATE POLICY "Users can send messages in accessible pages" 
    ON public.messages 
    FOR INSERT
    WITH CHECK (
        messages.user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = messages.page_id
            AND EXISTS (
                SELECT 1 FROM public.team_members tm
                WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()
            )
            AND (
                NOT p.is_private 
                OR EXISTS (
                    SELECT 1 FROM public.page_members pm 
                    WHERE pm.page_id = p.id AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Allow users to UPDATE their own messages.
CREATE POLICY "Users can update their own messages" 
    ON public.messages 
    FOR UPDATE
    USING (messages.user_id = auth.uid());

-- Allow users to DELETE their own messages (or page admins/team owners - more complex policy if needed).
CREATE POLICY "Users can delete their own messages" 
    ON public.messages 
    FOR DELETE
    USING (messages.user_id = auth.uid());


-- POLICIES FOR 'page_members' TABLE

-- Allow users to see their own page memberships.
-- Allow team owners or page creators (if page creator becomes page admin) to see page memberships for pages in their team/created by them.
CREATE POLICY "Users can view relevant page memberships" 
    ON public.page_members 
    FOR SELECT
    USING (
        page_members.user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.pages p
            JOIN public.teams t ON p.team_id = t.id
            WHERE p.id = page_members.page_id 
            AND (t.owner_id = auth.uid() OR p.created_by = auth.uid())
        )
    );

-- Allow team owners or page creators (if page creator becomes page admin) to add/remove page members.
CREATE POLICY "Team owners or page admins can manage page members" 
    ON public.page_members 
    FOR ALL -- INSERT, UPDATE, DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            JOIN public.teams t ON p.team_id = t.id
            WHERE p.id = page_members.page_id 
            AND (t.owner_id = auth.uid() OR p.created_by = auth.uid())
        )
    );


-- Add indexes for foreign keys and common query patterns
CREATE INDEX IF NOT EXISTS idx_pages_team_id ON public.pages(team_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_by ON public.pages(created_by);

CREATE INDEX IF NOT EXISTS idx_messages_page_id ON public.messages(page_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON public.messages(parent_message_id);

CREATE INDEX IF NOT EXISTS idx_page_members_page_id ON public.page_members(page_id);
CREATE INDEX IF NOT EXISTS idx_page_members_user_id ON public.page_members(user_id);

-- Commit transaction
COMMIT; 