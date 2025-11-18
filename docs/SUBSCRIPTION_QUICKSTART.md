# Quick Start: Using the Subscription System

## For Developers

### Checking Limits in Your Code

```typescript
import { SubscriptionService } from '@/lib/services/subscription-service'

// In your API route
const subscriptionService = new SubscriptionService()
const limitCheck = await subscriptionService.checkLimit(userId, 'maxTasks')

if (!limitCheck.allowed) {
  return NextResponse.json(
    { 
      error: limitCheck.reason,
      upgrade: true,
      current: limitCheck.current,
      limit: limitCheck.limit
    },
    { status: 403 }
  )
}

// Create the resource...

// Track usage
await subscriptionService.incrementUsage(userId, 'tasks_created')
```

### Available Limit Keys

| Limit Key | Tracks Metric | Free Limit | Pro Limit |
|-----------|---------------|------------|-----------|
| `maxTasks` | `tasks_created` | 50 | ∞ |
| `maxWorkspaces` | `workspaces_created` | 1 | ∞ |
| `maxFriends` | `friends_count` | 10 | ∞ |
| `maxNudgesPerDay` | `nudges_sent` | 3 | ∞ |
| `jarvisConversationsPerMonth` | `jarvis_conversations` | 5 | ∞ |
| `jarvisTokensPerMonth` | `jarvis_tokens` | 10,000 | 100,000 |

### Showing Upgrade Prompts

```typescript
'use client'
import { UpgradePrompt } from '@/components/UpgradePrompt'

// When user hits limit
<UpgradePrompt
  feature="tasks"
  current={50}
  limit={50}
  message="You've reached your task limit. Upgrade for unlimited tasks!"
/>
```

## For Users

### How to Upgrade

1. Go to **Settings** → **Subscription** or visit `/pricing`
2. Click **"Upgrade to Pro"**
3. Choose monthly ($5/mo) or yearly ($50/yr - save 17%)
4. Complete payment on Stripe
5. Enjoy Pro features immediately!

### Managing Your Subscription

1. Go to **Settings** → **Subscription**
2. Click **"Manage Billing"**
3. In Stripe portal you can:
   - Change payment method
   - Update billing info
   - View invoices
   - Cancel subscription
   - Reactivate subscription

### What Happens on Downgrade?

- You keep Pro features until end of billing period
- Data is never deleted
- If you exceed Free limits, you'll see warnings
- Can re-upgrade anytime

## Testing Locally

### 1. Install Stripe CLI

```bash
# Mac
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
```

### 2. Forward Webhooks

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 3. Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Use any future date and any 3-digit CVC.

### 4. Simulate Events

```bash
# Trigger successful payment
stripe trigger payment_intent.succeeded

# Trigger subscription cancellation
stripe trigger customer.subscription.deleted
```

## Common Tasks

### Get User's Current Plan

```typescript
const subscription = await subscriptionService.getUserSubscription(userId)
console.log(subscription.plan?.name) // 'free' or 'pro'
```

### Get Usage Stats

```typescript
const subWithUsage = await subscriptionService.getUserSubscriptionWithUsage(userId)
console.log(subWithUsage.usage)
// {
//   tasks: 25,
//   workspaces: 1,
//   friends: 5,
//   nudgesToday: 1,
//   jarvisConversationsThisMonth: 3,
//   jarvisTokensThisMonth: 5000
// }
```

### Manually Adjust Usage

```typescript
// Increment
await subscriptionService.incrementUsage(userId, 'tasks_created', 5)

// Decrement (e.g., when deleting)
await subscriptionService.decrementUsage(userId, 'tasks_created', 1)
```

## Troubleshooting

### Webhook Not Firing

**Problem**: Stripe events not being received

**Solution**: 
1. Check Stripe CLI is running
2. Verify webhook secret in `.env.local`
3. Check webhook endpoint in Stripe dashboard
4. Look for errors in terminal where Stripe CLI is running

### User Can't Upgrade

**Problem**: Checkout session creation fails

**Solution**:
1. Verify Stripe keys in `.env.local`
2. Check price IDs are set in `subscription_plans` table
3. Look for errors in browser console
4. Ensure user is authenticated

### Limits Not Enforcing

**Problem**: User can create resources beyond limit

**Solution**:
1. Check API route has `checkLimit()` call
2. Verify subscription service is imported
3. Ensure error response is returned (403 status)
4. Check database `subscription_usage` table for correct values

### Usage Not Tracking

**Problem**: Usage count doesn't increase

**Solution**:
1. Check `incrementUsage()` is called after creation
2. Verify metric name matches exactly
3. Check `subscription_usage` table for records
4. Look for errors in API route logs

## Pro Tips

✅ **Always check limits before creating resources**, not after
✅ **Track usage after successful creation**, not before
✅ **Use typed limit keys** from `SubscriptionLimits` interface
✅ **Show clear upgrade paths** when limits are hit
✅ **Test with both Free and Pro accounts** during development
✅ **Monitor webhook logs** in Stripe dashboard
✅ **Use Stripe test mode** until ready for production

## Need Help?

- 📖 Read full docs: `docs/SUBSCRIPTION_SYSTEM.md`
- 💬 Check implementation: `docs/SUBSCRIPTION_IMPLEMENTATION.md`
- 🔍 Look at service code: `lib/services/subscription-service.ts`
- 🎨 See UI examples: `app/pricing/page.tsx`, `app/settings/subscription/page.tsx`
