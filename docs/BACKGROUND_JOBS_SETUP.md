# Background Jobs Setup Guide

This guide explains how to set up the automated background jobs for Pauv:
1. **Stats Cache Refresh** - Updates market data every 5 minutes (pg_cron)
2. **Price History Snapshots** - Records hourly OHLC data (pg_cron)
3. **Queue Processor** - Processes orders instantly (Database Webhook + Edge Function)
4. **Queue Cleanup** - Removes old entries daily (pg_cron)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     INSERT      ┌──────────────────┐          │
│  │    queue     │ ───────────────▶│ Database Webhook │          │
│  │    table     │                 └────────┬─────────┘          │
│  └──────────────┘                          │                    │
│                                            ▼                    │
│                                   ┌──────────────────┐          │
│                                   │  Edge Function   │          │
│                                   │  process-queue   │          │
│                                   └────────┬─────────┘          │
│                                            │                    │
│                                            ▼                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │         process_all_pending_orders()                  │      │
│  │         (processes until queue is empty)              │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    pg_cron Jobs                        │      │
│  │  • refresh_issuer_stats_cache() - every 5 minutes     │      │
│  │  • hourly-price-snapshot - every hour                 │      │
│  │  • cleanup-old-queue-entries - daily at 3 AM          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Enable pg_cron Extension

pg_cron is only available on **Supabase Pro plan and above**.

1. Go to your Supabase Dashboard
2. Navigate to **Database > Extensions**
3. Search for `pg_cron`
4. Click **Enable**

---

## Step 2: Deploy the Migration

Push the migration to create the functions and schedule jobs:

```bash
npx supabase@latest db push
```

This creates:
- `process_next_queue_order()` - Processes a single order
- `process_all_pending_orders()` - Processes all pending orders
- `refresh_issuer_stats_cache()` - Already exists, scheduled to run every 5 min
- Scheduled pg_cron jobs for stats refresh, price snapshots, and cleanup

---

## Step 3: Deploy the Edge Function

Deploy the queue processor Edge Function:

```bash
# Login to Supabase (if not already)
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy process-queue
```

**Note:** Replace `YOUR_PROJECT_REF` with your actual project reference ID (found in Project Settings).

---

## Step 4: Set Edge Function Secrets

The Edge Function needs the service role key to bypass RLS:

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find your service role key in: **Project Settings > API > service_role key**

⚠️ **Never expose the service role key in client-side code!**

---

## Step 5: Create the Database Webhook

This is the magic that makes queue processing instant!

1. Go to your Supabase Dashboard
2. Navigate to **Database > Webhooks**
3. Click **Create a new webhook**
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `process-queue-webhook` |
| Table | `queue` |
| Events | ✅ INSERT |
| Type | `Supabase Edge Functions` |
| Edge Function | `process-queue` |
| HTTP Headers | (leave default) |

5. Click **Create webhook**

---

## Step 6: Verify the Setup

### Test the Queue Processor

1. Insert a test order:
```sql
INSERT INTO public.queue (user_id, ticker, order_type, amount_usdp, status)
VALUES ('your-user-id', 'AAPL', 'buy', 100, 'pending');
```

2. Check Edge Function logs:
   - Go to **Edge Functions > process-queue > Logs**
   - You should see the function wake up and process the order

3. Verify the order was processed:
```sql
SELECT * FROM public.queue ORDER BY date DESC LIMIT 5;
-- Status should be 'completed' or 'failed'
```

### Test the Stats Cache

1. Manually trigger a refresh:
```sql
SELECT refresh_issuer_stats_cache();
```

2. Check the cache:
```sql
SELECT * FROM public.issuer_stats_cache;
```

3. Verify pg_cron jobs are scheduled:
```sql
SELECT jobid, jobname, schedule, command FROM cron.job;
```

---

## Monitoring

### View Cron Job History
```sql
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### View Queue Status
```sql
SELECT 
    status, 
    COUNT(*) as count,
    MIN(date) as oldest,
    MAX(date) as newest
FROM public.queue 
GROUP BY status;
```

### View Edge Function Logs
- Dashboard: **Edge Functions > process-queue > Logs**
- CLI: `npx supabase functions logs process-queue`

---

## Troubleshooting

### Queue Not Processing

1. **Check webhook is enabled:**
   - Dashboard > Database > Webhooks
   - Verify `process-queue-webhook` is active

2. **Check Edge Function is deployed:**
   ```bash
   npx supabase functions list
   ```

3. **Check secrets are set:**
   ```bash
   npx supabase secrets list
   ```

4. **Check Edge Function logs for errors:**
   ```bash
   npx supabase functions logs process-queue --tail
   ```

### Stats Not Refreshing

1. **Check pg_cron extension is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check job is scheduled:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'refresh-issuer-stats-cache';
   ```

3. **Check job run history for errors:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-issuer-stats-cache')
   ORDER BY start_time DESC 
   LIMIT 5;
   ```

### Manually Run Jobs

```sql
-- Refresh stats cache manually
SELECT refresh_issuer_stats_cache();

-- Process all pending queue orders manually
SELECT process_all_pending_orders();
```

---

## Cost Considerations

- **Edge Functions:** Billed per invocation and execution time. Event-driven model is very cost-effective since it only runs when there's work.
- **pg_cron:** Runs within the database, no additional cost beyond database usage.
- **Database Webhooks:** Free, handled by Supabase infrastructure.

---

## Local Development

For local development, use the standalone queue processor script:

```bash
# Process all pending orders once
npm run process-queue:all

# Run continuously (for local testing)
npm run process-queue:continuous
```

The local script connects to your Supabase instance using the service role key from `.env.local`.
