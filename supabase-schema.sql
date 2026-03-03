-- =============================================
-- CRM Pro - Supabase PostgreSQL Schema
-- Production-ready schema with RLS policies
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('admin', 'manager');
CREATE TYPE task_status AS ENUM ('new', 'in_progress', 'waiting', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE deal_stage AS ENUM ('lead', 'prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'churned');

-- =============================================
-- TABLES
-- =============================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'manager',
    avatar TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    messenger TEXT,
    company TEXT,
    position TEXT,
    address TEXT,
    notes TEXT,
    source TEXT,
    client_type TEXT DEFAULT 'prospect',
    status client_status NOT NULL DEFAULT 'active',
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT client_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Deals table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    direction TEXT NOT NULL DEFAULT 'income',
    stage deal_stage NOT NULL DEFAULT 'lead',
    margin DECIMAL(5, 2),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close DATE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    responsible_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    status task_status NOT NULL DEFAULT 'new',
    priority task_priority NOT NULL DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    responsible_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task logs table (audit trail)
CREATE TABLE IF NOT EXISTS public.task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner ON public.clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created ON public.clients(created_at);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_client ON public.deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_responsible ON public.deals(responsible_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created ON public.deals(created_at);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_responsible ON public.tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON public.tasks(created_at);

-- Task logs indexes
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_user ON public.task_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_task_logs_created ON public.task_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Clients policies
CREATE POLICY "Users can view all clients" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Users can create clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update clients" ON public.clients
    FOR UPDATE USING (auth.uid() = owner_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete clients" ON public.clients
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Deals policies
CREATE POLICY "Users can view all deals" ON public.deals
    FOR SELECT USING (true);

CREATE POLICY "Users can create deals" ON public.deals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update deals" ON public.deals
    FOR UPDATE USING (auth.uid() = responsible_id OR 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete deals" ON public.deals
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Tasks policies
CREATE POLICY "Users can view team tasks" ON public.tasks
    FOR SELECT USING (true);

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their tasks" ON public.tasks
    FOR UPDATE USING (
        auth.uid() = responsible_id OR 
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete tasks" ON public.tasks
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Task logs policies
CREATE POLICY "Users can view task logs" ON public.task_logs
    FOR SELECT USING (true);

CREATE POLICY "System can create task logs" ON public.task_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'manager')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to log task changes
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.task_logs (task_id, action_type, changed_by, old_value, new_value)
        VALUES (NEW.id, 'created', NEW.created_by, NULL, json_build_object('title', NEW.title)::text);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO public.task_logs (task_id, action_type, changed_by, old_value, new_value)
            VALUES (NEW.id, 'status_change', auth.uid(), OLD.status::text, NEW.status::text);
        END IF;
        
        -- Log due date changes
        IF OLD.due_date != NEW.due_date THEN
            INSERT INTO public.task_logs (task_id, action_type, changed_by, old_value, new_value)
            VALUES (NEW.id, 'due_date_change', auth.uid(), OLD.due_date::text, NEW.due_date::text);
        END IF;
        
        -- Log completion
        IF NEW.status = 'done' AND OLD.status != 'done' THEN
            INSERT INTO public.task_logs (task_id, action_type, changed_by, old_value, new_value)
            VALUES (NEW.id, 'completed', auth.uid(), OLD.status::text, 'done');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task logging
CREATE TRIGGER task_change_logging
    AFTER INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_changes();

-- =============================================
-- VIEWS
-- =============================================

-- View for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
    t.*,
    u.name as responsible_name,
    c.name as client_name,
    d.title as deal_title
FROM public.tasks t
LEFT JOIN public.users u ON t.responsible_id = u.id
LEFT JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.deals d ON t.deal_id = d.id
WHERE t.due_date < CURRENT_DATE
  AND t.status != 'done'
ORDER BY t.due_date ASC;

-- View for today's tasks
CREATE OR REPLACE VIEW today_tasks AS
SELECT 
    t.*,
    u.name as responsible_name,
    c.name as client_name,
    d.title as deal_title
FROM public.tasks t
LEFT JOIN public.users u ON t.responsible_id = u.id
LEFT JOIN public.clients c ON t.client_id = c.id
LEFT JOIN public.deals d ON t.deal_id = d.id
WHERE t.due_date = CURRENT_DATE
ORDER BY t.priority DESC;

-- View for task statistics
CREATE OR REPLACE VIEW task_statistics AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue_tasks,
    COUNT(CASE WHEN t.due_date = CURRENT_DATE THEN 1 END) as today_tasks
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.responsible_id
GROUP BY u.id, u.name;

-- =============================================
-- SEED DATA (Initial Users)
-- =============================================

-- Note: Users are created via Supabase Auth, then profile is auto-created
-- Run this after creating users in Supabase Auth:

-- Example: Update user roles after signup
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@crm.com';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service role (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
