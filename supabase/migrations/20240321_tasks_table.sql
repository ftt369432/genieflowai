-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    due_date TIMESTAMP WITH TIME ZONE,
    assignee UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    project_id UUID REFERENCES projects(id),
    notebook_id UUID REFERENCES notebooks(id),
    workflow_id UUID REFERENCES workflows(id),
    parent_task_id UUID REFERENCES tasks(id),
    sub_tasks UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_notebook_id_idx ON tasks(notebook_id);
CREATE INDEX IF NOT EXISTS tasks_workflow_id_idx ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own tasks and tasks assigned to them
CREATE POLICY "Users can view their own tasks"
    ON tasks
    FOR SELECT
    USING (
        created_by = auth.uid() OR
        assignee = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Policy for users to create tasks
CREATE POLICY "Users can create tasks"
    ON tasks
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Policy for users to update their own tasks
CREATE POLICY "Users can update their own tasks"
    ON tasks
    FOR UPDATE
    USING (
        created_by = auth.uid() OR
        assignee = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        created_by = auth.uid() OR
        assignee = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.owner_id = auth.uid()
        )
    );

-- Policy for users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
    ON tasks
    FOR DELETE
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.owner_id = auth.uid()
        )
    ); 