-- Migration: Add auth triggers and subscription plans
-- Created: 2025-11-20
-- Description: Adds triggers for user signup and default subscription plans

BEGIN;

-- ============================================================================
-- CREATE SUBSCRIPTION PLANS
-- ============================================================================

-- Create default subscription plans if they don't exist
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, features, limits, is_active)
VALUES 
  ('free', 'Free', 'Perfect for getting started', 0, 0, 
   '["Up to 3 workspaces", "Up to 50 tasks per workspace", "Basic collaboration", "7-day activity history"]'::jsonb,
   '{"workspaces": 3, "tasks_per_workspace": 50, "members_per_workspace": 3}'::jsonb,
   true),
  ('pro', 'Pro', 'For power users and small teams', 9.99, 99.99,
   '["Unlimited workspaces", "Unlimited tasks", "Advanced collaboration", "Unlimited activity history", "Priority support", "Custom tags", "Advanced analytics"]'::jsonb,
   '{"workspaces": -1, "tasks_per_workspace": -1, "members_per_workspace": 10}'::jsonb,
   true),
  ('team', 'Team', 'For growing teams', 19.99, 199.99,
   '["Everything in Pro", "Unlimited team members", "Advanced permissions", "SSO integration", "Dedicated support", "Custom branding"]'::jsonb,
   '{"workspaces": -1, "tasks_per_workspace": -1, "members_per_workspace": -1}'::jsonb,
   true)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- CREATE AUTH TRIGGERS
-- ============================================================================

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_plan ON public.profiles;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger to assign free plan to new users
CREATE TRIGGER on_auth_user_created_assign_plan
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_free_plan_to_new_user();

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify triggers were created
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname IN ('on_auth_user_created', 'on_auth_user_created_assign_plan')
ORDER BY t.tgname;

-- Verify subscription plans were created
SELECT id, name, price_monthly, is_active FROM public.subscription_plans;
