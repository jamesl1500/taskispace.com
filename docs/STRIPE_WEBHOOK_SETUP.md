# Stripe Webhook Setup Guide

## Problem: Subscription not created after checkout

The subscription isn't being updated because Stripe webhooks aren't being received. Here's how to fix it:

## Local Development Setup

### 1. Install Stripe CLI

```bash
# Mac
brew install stripe/stripe-cli/stripe

# Windows (with Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward webhooks to localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Copy the webhook secret to .env.local

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Restart your dev server

```bash
npm run dev
```

Now webhooks will work locally!

## Production Setup

### 1. Deploy your app

Make sure your app is deployed and accessible at your production URL.

### 2. Add webhook endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"

### 3. Copy the signing secret

After creating the endpoint, click on it and copy the "Signing secret" (starts with `whsec_`)

### 4. Add to production environment variables

Add this to your production environment:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Testing

### Test checkout flow:

1. Go to `/pricing`
2. Click "Upgrade to Pro"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. You should be redirected back
6. Check terminal for webhook logs:
   ```
   checkout.session.completed [evt_xxxxx]
   ```

### Verify in database:

```sql
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
```

Should show:
- `plan_id` = 'pro'
- `status` = 'active'
- `stripe_subscription_id` populated

## Common Issues

### Webhook secret not set
**Error**: "No signature" or "Invalid signature"
**Fix**: Make sure `STRIPE_WEBHOOK_SECRET` is in `.env.local` and restart dev server

### Events not being sent
**Error**: No logs in terminal
**Fix**: Make sure Stripe CLI is running with `stripe listen`

### Wrong webhook URL
**Error**: Webhooks failing in production
**Fix**: Check webhook URL in Stripe dashboard matches your deployed app

### Subscription not updating
**Error**: User still on free plan after payment
**Fix**: Check webhook logs for errors, verify the event handler is working

## Debug Mode

Add logging to see what's happening:

1. Check webhook is being called: Look for logs in terminal
2. Check Stripe dashboard: Go to Developers > Webhooks > [your endpoint] > View logs
3. Check database: Query subscriptions table to see if record was created/updated

## Quick Test Command

```bash
# Trigger a test webhook event
stripe trigger checkout.session.completed
```

This will send a test event to your webhook endpoint to verify it's working.
