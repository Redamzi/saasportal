# Stripe Payment Integration Setup Guide

## ⚠️ IMPORTANT: NO PLACEHOLDERS - EVERYTHING MUST WORK!

This integration is **fully functional** and production-ready. Follow these steps exactly.

---

## 🎯 Overview

**What this does:**
1. User clicks "Purchase Package" on Credits page
2. Redirects to Stripe Checkout (real payment)
3. After payment, Stripe calls webhook
4. Webhook adds credits to user account
5. User returns to Dashboard with success message
6. Credits are immediately available

**What you get:**
- ✅ Real Stripe payments (EUR)
- ✅ Automatic credit addition via webhook
- ✅ Transaction logging
- ✅ Failed transaction tracking
- ✅ Atomic operations (no double-charging or lost credits)

---

## 📋 Prerequisites

Before starting, you need:
- [ ] Stripe account (stripe.com)
- [ ] Supabase project (supabase.com)
- [ ] Backend deployed and accessible (api.voyanero.com)
- [ ] Frontend deployed (app.voyanero.com)

---

## 🔧 Step-by-Step Setup

### **Step 1: Stripe Configuration**

1. **Get your Stripe API keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy **Secret key** (starts with `sk_test_...` for testing)
   - Copy **Publishable key** (not used in backend, but save it)

2. **Add to Coolify/Backend Environment Variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_... # We'll get this in Step 3
   FRONTEND_URL=https://app.voyanero.com
   ```

### **Step 2: Supabase Database Setup**

1. **Go to Supabase SQL Editor:**
   - Navigate to: https://app.supabase.com → Your Project → SQL Editor

2. **Run the migration:**
   - Copy entire contents of `backend/database/migrations/001_stripe_credits.sql`
   - Paste into SQL Editor
   - Click **RUN**

3. **Verify tables were created:**
   ```sql
   SELECT * FROM credit_transactions LIMIT 1;
   SELECT * FROM failed_transactions LIMIT 1;
   ```

4. **Test the function (optional):**
   ```sql
   -- Replace with a real user ID from your auth.users table
   SELECT add_credits('actual-user-uuid-here'::UUID, 100);

   -- Check credits were added
   SELECT credits_balance FROM profiles WHERE id = 'actual-user-uuid-here';
   ```

### **Step 3: Configure Stripe Webhook**

1. **In Stripe Dashboard:**
   - Go to: [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click **+ Add endpoint**

2. **Configure endpoint:**
   ```
   Endpoint URL: https://api.voyanero.com/api/credits/webhook
   Description: Voyanero Credit Purchase Webhook
   ```

3. **Select events to listen to:**
   - Search for and select: `checkout.session.completed`
   - Click **Add events**

4. **Get webhook signing secret:**
   - After creating, click on the webhook
   - Click **Reveal** under "Signing secret"
   - Copy the secret (starts with `whsec_...`)

5. **Add to Coolify Environment:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

6. **Restart backend** to load new environment variable

### **Step 4: Test the Integration**

1. **Check health endpoint:**
   ```bash
   curl https://api.voyanero.com/api/credits/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "credits-api",
     "stripe_configured": true,
     "webhook_configured": true
   }
   ```

2. **Test purchase flow (use Stripe test cards):**
   - Go to: https://app.voyanero.com/credits
   - Click any "Purchase Package" button
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - Complete payment

3. **Verify credits were added:**
   - You should be redirected to Dashboard
   - Success message should appear
   - Credits balance should be updated

4. **Check Stripe webhook logs:**
   - Go to: Stripe Dashboard → Developers → Webhooks
   - Click on your webhook
   - Check **Events** tab for `checkout.session.completed`
   - Status should be **Succeeded**

---

## 🧪 Testing Checklist

Before going live, verify:

- [ ] Stripe health check shows all configured
- [ ] Test purchase with test card works
- [ ] Credits are added to account (check in Supabase)
- [ ] Transaction is logged in `credit_transactions` table
- [ ] Webhook events show in Stripe Dashboard
- [ ] Success message appears on Dashboard
- [ ] Failed purchases don't charge or add credits
- [ ] Cancelled payments redirect correctly

---

## 🔴 Production Deployment

### **Before going live:**

1. **Switch to Production Stripe keys:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_... # Production key
   ```

2. **Create Production webhook:**
   - Same as Step 3, but in **Live mode** (not Test mode)
   - Use production signing secret

3. **Update environment variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_production_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
   FRONTEND_URL=https://app.voyanero.com
   ```

4. **Test with real card** (small amount first!)

---

## 🐛 Troubleshooting

### **Credits not added after payment:**

1. **Check Stripe webhook logs:**
   - Stripe Dashboard → Webhooks → Your webhook → Events
   - Look for errors or failed requests

2. **Check backend logs:**
   ```bash
   # Look for webhook processing messages
   grep "Successfully added.*credits" backend.log
   grep "Error processing payment" backend.log
   ```

3. **Check failed_transactions table:**
   ```sql
   SELECT * FROM failed_transactions WHERE resolved = FALSE;
   ```

4. **Manually add credits (if needed):**
   ```sql
   SELECT add_credits('user-uuid'::UUID, 100);

   -- Mark as resolved
   UPDATE failed_transactions
   SET resolved = TRUE, resolved_at = NOW()
   WHERE id = 'transaction-id';
   ```

### **Webhook signature verification fails:**

- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- Restart backend after adding environment variable
- Check webhook secret matches in Stripe Dashboard

### **Payment succeeds but user sees error:**

- This is OK! Webhook runs in background
- Credits are added even if redirect fails
- Check user's account - credits should be there

---

## 📊 Monitoring

### **Check credit transactions:**
```sql
-- Recent purchases
SELECT * FROM credit_transactions
WHERE type = 'purchase'
ORDER BY created_at DESC
LIMIT 10;

-- Total revenue (in credits)
SELECT SUM(amount) as total_credits_sold
FROM credit_transactions
WHERE type = 'purchase';

-- User stats
SELECT * FROM user_credit_stats
WHERE user_id = 'specific-user-id';
```

### **Check webhook health:**
```bash
curl https://api.voyanero.com/api/credits/health
```

---

## 🔐 Security Notes

- Webhook signature verification is **required** and implemented
- RPC function uses `SECURITY DEFINER` for atomic operations
- Row Level Security (RLS) enabled on transactions table
- Failed transactions logged for manual review
- All operations are idempotent (safe to retry)

---

## 💰 Pricing Configuration

Current packages (defined in `frontend/src/pages/Credits.jsx`):

| Package | Credits | Price | Per Credit |
|---------|---------|-------|------------|
| Starter | 100 | €29 | €0.29 |
| Professional | 500 | €99 | €0.20 |
| Enterprise | 2000 | €299 | €0.15 |

To change pricing, edit `Credits.jsx` line 13-28.

---

## ✅ Success Criteria

Integration is working if:

1. ✅ User can complete payment
2. ✅ Credits are added automatically
3. ✅ Transaction is logged
4. ✅ Success message appears
5. ✅ Webhook shows success in Stripe
6. ✅ Health check shows configured
7. ✅ No failed transactions

---

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Check Stripe webhook logs
3. Check Supabase logs
4. Check backend logs
5. Check `failed_transactions` table

**Everything here is REAL and WORKING - no placeholders!** 🚀
