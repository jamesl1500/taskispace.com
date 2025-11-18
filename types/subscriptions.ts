export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number | null
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  features: string[]
  limits: SubscriptionLimits
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  trial_end: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  plan?: SubscriptionPlan
}

export interface SubscriptionUsage {
  id: string
  user_id: string
  metric_name: string
  current_value: number
  period_start: string
  period_end: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionLimits {
  maxTasks: number
  maxWorkspaces: number
  maxFriends: number
  maxNudgesPerDay: number
  jarvisConversationsPerMonth: number
  jarvisTokensPerMonth: number
  conversationHistoryDays: number
  maxFileSize: number
}

export interface SubscriptionWithUsage extends Subscription {
  usage: {
    tasks: number
    workspaces: number
    friends: number
    nudgesToday: number
    jarvisConversationsThisMonth: number
    jarvisTokensThisMonth: number
  }
}

// Plan constants
export const PLAN_IDS = {
  FREE: 'free',
  PRO: 'pro'
} as const

// Tier limits
export const FREE_TIER_LIMITS: SubscriptionLimits = {
  maxTasks: 50,
  maxWorkspaces: 1,
  maxFriends: 10,
  maxNudgesPerDay: 3,
  jarvisConversationsPerMonth: 5,
  jarvisTokensPerMonth: 10000,
  conversationHistoryDays: 30,
  maxFileSize: 1 * 1024 * 1024, // 1MB
}

export const PRO_TIER_LIMITS: SubscriptionLimits = {
  maxTasks: -1, // -1 = unlimited
  maxWorkspaces: -1,
  maxFriends: -1,
  maxNudgesPerDay: -1,
  jarvisConversationsPerMonth: -1,
  jarvisTokensPerMonth: 100000,
  conversationHistoryDays: -1,
  maxFileSize: 10 * 1024 * 1024, // 10MB
}

// Helper to check if value is unlimited (-1)
export function isUnlimited(value: number): boolean {
  return value === -1
}

// Helper to check if limit is reached
export function isLimitReached(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return false
  return current >= limit
}

// Pro features list for comparison
export const PRO_FEATURES = [
  'Unlimited tasks & workspaces',
  'Unlimited Jarvis AI conversations',
  'Up to 100K tokens per month for Jarvis',
  'Advanced productivity analytics',
  'Unlimited friends & nudges',
  'Team collaboration features',
  'Priority support (24h response)',
  'Custom themes & dark mode',
  'Calendar sync (coming soon)',
  'File attachments up to 10MB',
  'Export data (CSV, JSON)',
  'Recurring tasks',
  'Task templates',
  'Bulk operations',
] as const

export const FREE_FEATURES = [
  'Up to 50 tasks',
  '1 workspace',
  'Basic lists & subtasks',
  '5 Jarvis conversations per month',
  'Up to 10K tokens for Jarvis',
  'Up to 10 friends',
  'Email notifications',
  'Basic search',
  'File attachments up to 1MB',
] as const
