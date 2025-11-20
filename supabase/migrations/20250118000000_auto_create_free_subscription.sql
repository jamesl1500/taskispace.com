-- Auto-create free subscription for new users
-- This trigger ensures every new user gets a free plan subscription automatically

-- Function to create free subscription for new user
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id
  FROM public.subscription_plans
  WHERE name = 'free'
  LIMIT 1;

  -- If free plan exists, create subscription for new user
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      created_at
    ) VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_subscription() TO service_role;
