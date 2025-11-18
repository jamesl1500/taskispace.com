# Subscription System Documentation

## Overview
TaskiSpace uses a freemium subscription model with two tiers:
- **Free**: Limited features (50 tasks, 1 workspace, 10 friends, 5 Jarvis chats/month)
- **Pro**: $5/month with unlimited access to most features

## Database Schema

### Tables
- `subscription_plans`: Stores plan definitions with pricing and limits
- `subscriptions`: Links users to their active subscription
- `subscription_usage`: Tracks monthly/daily usage metrics

### Default Plans
```sql
-- Free Plan (ID: 'free')
- Price: $0
- Limits:
  - maxTasks: 50
  - maxWorkspaces: 1
  - maxFriends: 10
  - maxNudgesPerDay: 3
  - jarvisConversationsPerMonth: 5
  - jarvisTokensPerMonth: 10,000
  - conversationHistoryDays: 30
  - maxFileSize: 1MB

-- Pro Plan (ID: 'pro')
- Price: $5/month or $50/year
- Limits:
  - maxTasks: -1 (unlimited)
  - maxWorkspaces: -1 (unlimited)
  - maxFriends: -1 (unlimited)
  - maxNudgesPerDay: -1 (unlimited)
  - jarvisConversationsPerMonth: -1 (unlimited)
  - jarvisTokensPerMonth: 100,000
  - conversationHistoryDays: -1 (unlimited)
  - maxFileSize: 10MB
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Stripe Keys

1. **Create Stripe Account**: Sign up at https://stripe.com
2. **Get API Keys**: Go to Developers > API keys
   - Copy Secret key → `STRIPE_SECRET_KEY`
   - Copy Publishable key → `STRIPE_PUBLISHABLE_KEY`

3. **Create Products & Prices**:
   - Go to Products > Add Product
   - Create "TaskiSpace Pro" product
   - Add price: $5.00 USD monthly recurring
   - Add price: $50.00 USD yearly recurring (optional)
   - Copy Price IDs and update in database:
     ```sql
     UPDATE subscription_plans 
     SET stripe_price_id_monthly = 'price_xxxxx',
         stripe_price_id_yearly = 'price_yyyyy'
     WHERE id = 'pro';
     ```

4. **Setup Webhook**:
   - Go to Developers > Webhooks > Add endpoint
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

5. **Testing Locally**:
   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
   - Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Use test webhook secret provided by CLI

## API Routes

### GET /api/subscription
Get current user's subscription with usage stats.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "plan_id": "free",
  "status": "active",
  "plan": {
    "id": "free",
    "name": "Free",
    "price_monthly": 0,
    "limits": { ... }
  },
  "usage": {
    "tasks": 15,
    "workspaces": 1,
    "friends": 3,
    "nudgesToday": 1,
    "jarvisConversationsThisMonth": 2,
    "jarvisTokensThisMonth": 3500
  }
}
```

### GET /api/subscription/plans
Get all available subscription plans.

### POST /api/stripe/checkout
Create a Stripe checkout session.

**Request:**
```json
{
  "planId": "pro",
  "billingPeriod": "monthly" // or "yearly"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/stripe/portal
Get Stripe customer portal URL for managing subscription.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### POST /api/stripe/webhook
Webhook endpoint for Stripe events (handled automatically).

## Usage in Code

### Check Limits Before Creating Resources

```typescript
import { SubscriptionService } from '@/lib/services/subscription-service'

// In your API route or server action
const subscriptionService = new SubscriptionService()
const limitCheck = await subscriptionService.checkLimit(userId, 'maxTasks')

if (!limitCheck.allowed) {
  return NextResponse.json(
    { 
      error: limitCheck.reason,
      upgrade: true 
    },
    { status: 403 }
  )
}

// Create the task...
await subscriptionService.incrementUsage(userId, 'tasks_created')
```

### Track Usage

```typescript
// When creating a task
await subscriptionService.incrementUsage(userId, 'tasks_created')

// When deleting a task
await subscriptionService.decrementUsage(userId, 'tasks_created')

// When sending Jarvis message
await subscriptionService.incrementUsage(userId, 'jarvis_tokens', tokenCount)
```

### Limit Keys Reference

- `maxTasks` → tracks `tasks_created`
- `maxWorkspaces` → tracks `workspaces_created`
- `maxFriends` → tracks `friends_count`
- `maxNudgesPerDay` → tracks `nudges_sent` (resets daily)
- `jarvisConversationsPerMonth` → tracks `jarvis_conversations` (resets monthly)
- `jarvisTokensPerMonth` → tracks `jarvis_tokens` (resets monthly)

## Frontend Integration

### Upgrade Flow

1. User hits limit → Show upgrade prompt with benefit messaging
2. Click "Upgrade to Pro" → Call `/api/stripe/checkout`
3. Redirect to Stripe Checkout
4. After payment → Redirect back to app with success message
5. Webhook updates subscription status automatically

### Manage Subscription

1. User goes to Settings > Subscription
2. Show current plan, usage stats, billing info
3. Button to "Manage Billing" → Call `/api/stripe/portal`
4. Redirect to Stripe portal for plan changes, payment methods, invoices

## Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Authentication: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Simulating Events
```bash
# Trigger a successful payment
stripe trigger payment_intent.succeeded

# Cancel a subscription
stripe trigger customer.subscription.deleted
```

## Security Notes

1. **RLS Policies**: All subscription tables have Row Level Security
2. **Webhook Validation**: Signatures verified before processing events
3. **Server-Side Checks**: Never trust client-side limit checks
4. **Rate Limiting**: Consider adding rate limits to prevent abuse

## Pro Features Checklist

- [ ] Unlimited tasks & workspaces
- [ ] Unlimited Jarvis conversations
- [ ] Advanced analytics dashboard
- [ ] Priority support (24h response)
- [ ] Custom themes & dark mode
- [ ] File attachments up to 10MB
- [ ] Export data (CSV, JSON)
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Bulk operations
- [ ] Calendar sync (future)
- [ ] Team collaboration (future)

## Next Steps

1. ✅ Database schema created
2. ✅ Service layer implemented
3. ✅ API routes created
4. ⏳ Implement tier limits in existing features
5. ⏳ Build pricing page UI
6. ⏳ Add upgrade prompts throughout app
7. ⏳ Create subscription management page
8. ⏳ Add Stripe price IDs to database
9. ⏳ Test subscription flow end-to-end
10. ⏳ Deploy and configure production webhooks
