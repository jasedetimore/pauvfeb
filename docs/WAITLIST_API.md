# Waitlist API — Integration Guide

This document describes the Supabase APIs needed to make the waitlist system fully functional, and how each frontend component should connect to them.

---

## Overview

The waitlist controls who can trade on the platform. On launch day the first 100 users gain access; each subsequent day another ~100 are unlocked. Users can share a referral code to move up 50 spots.

Currently the frontend uses **mock / deterministic data** (derived from the user's ID). Once the Supabase tables and functions below are created, every `WaitlistPanel` instance and the Header badge will read real positions from the API.

---

## 1. Database Schema

### `waitlist` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `user_id` | `uuid` FK → `auth.users(id)` | Unique — one entry per user |
| `position` | `integer` | Current queue position (lower = earlier access) |
| `referral_code` | `text` | Unique 9-char code, e.g. `PV-ABC123` |
| `referred_by` | `uuid` FK → `waitlist(user_id)` | Nullable — who referred this user |
| `is_unlocked` | `boolean` | `true` once the user is allowed to trade |
| `unlocked_at` | `timestamptz` | When access was granted |
| `created_at` | `timestamptz` | When the user joined the waitlist |

### RLS policies

- **Read own row:** `auth.uid() = user_id`
- **Read neighbors:** A Postgres function (see below) returns limited rows around the caller's position — no open SELECT on the whole table.
- **Insert:** Triggered automatically by the existing `handle_new_user` trigger (add a step that inserts a waitlist row when a new user signs up).
- **Update:** Only via server-side functions (admin or cron job).

---

## 2. Postgres Functions

### `get_waitlist_position()`

Returns the caller's position, referral code, and unlock status.

```sql
CREATE OR REPLACE FUNCTION public.get_waitlist_position()
RETURNS TABLE (
  position integer,
  referral_code text,
  is_unlocked boolean,
  unlocked_at timestamptz
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT position, referral_code, is_unlocked, unlocked_at
  FROM public.waitlist
  WHERE user_id = auth.uid();
$$;
```

### `get_waitlist_neighbors(radius integer DEFAULT 2)`

Returns the usernames and positions of users near the caller (±radius rows).

```sql
CREATE OR REPLACE FUNCTION public.get_waitlist_neighbors(radius integer DEFAULT 2)
RETURNS TABLE (
  username text,
  position integer,
  is_self boolean
)
LANGUAGE sql SECURITY DEFINER
AS $$
  WITH me AS (
    SELECT position FROM public.waitlist WHERE user_id = auth.uid()
  )
  SELECT u.username, w.position, (w.user_id = auth.uid()) AS is_self
  FROM public.waitlist w
  JOIN public.users u ON u.user_id = w.user_id
  CROSS JOIN me
  WHERE w.position BETWEEN me.position - radius AND me.position + radius
  ORDER BY w.position;
$$;
```

### `apply_referral(code text)`

Validates a referral code, links the caller, and moves them up 50 spots.

```sql
CREATE OR REPLACE FUNCTION public.apply_referral(code text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  referrer_id uuid;
  my_row public.waitlist%ROWTYPE;
BEGIN
  -- Find referrer
  SELECT user_id INTO referrer_id FROM public.waitlist WHERE referral_code = code;
  IF referrer_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid referral code');
  END IF;
  IF referrer_id = auth.uid() THEN
    RETURN json_build_object('error', 'Cannot refer yourself');
  END IF;

  SELECT * INTO my_row FROM public.waitlist WHERE user_id = auth.uid();
  IF my_row.referred_by IS NOT NULL THEN
    RETURN json_build_object('error', 'Already used a referral');
  END IF;

  -- Move up 50 spots (minimum position = 1)
  UPDATE public.waitlist
  SET position = GREATEST(1, position - 50),
      referred_by = referrer_id
  WHERE user_id = auth.uid();

  RETURN json_build_object('success', true, 'new_position', GREATEST(1, my_row.position - 50));
END;
$$;
```

### `unlock_next_wave()` — cron job

Run daily via `pg_cron` to unlock the next batch of users.

```sql
CREATE OR REPLACE FUNCTION public.unlock_next_wave(batch_size integer DEFAULT 100)
RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.waitlist
  SET is_unlocked = true, unlocked_at = now()
  WHERE is_unlocked = false
    AND position <= (
      SELECT COALESCE(MAX(position), 0) FROM public.waitlist WHERE is_unlocked = true
    ) + batch_size;
$$;
```

Schedule it:

```sql
SELECT cron.schedule('unlock-waitlist-wave', '0 12 * * *', $$SELECT public.unlock_next_wave(100)$$);
```

---

## 3. API Routes

### `GET /api/waitlist`

Returns the caller's position + neighbors. No body required (uses Supabase auth cookie).

```ts
// src/app/api/waitlist/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [posResult, neighborsResult] = await Promise.all([
    supabase.rpc("get_waitlist_position"),
    supabase.rpc("get_waitlist_neighbors", { radius: 2 }),
  ]);

  return NextResponse.json({
    position: posResult.data?.[0] ?? null,
    neighbors: neighborsResult.data ?? [],
  });
}
```

### `POST /api/waitlist/referral`

Applies a referral code.

```ts
// src/app/api/waitlist/referral/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  const { data, error } = await supabase.rpc("apply_referral", { code });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data);
}
```

---

## 4. React Hook

Create a shared hook so every WaitlistPanel instance uses the same cached data:

```ts
// src/lib/hooks/useWaitlist.ts
import useSWR from "swr";

interface WaitlistData {
  position: { position: number; referral_code: string; is_unlocked: boolean } | null;
  neighbors: { username: string; position: number; is_self: boolean }[];
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useWaitlist() {
  const { data, error, isLoading, mutate } = useSWR<WaitlistData>("/api/waitlist", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  return {
    position: data?.position?.position ?? null,
    referralCode: data?.position?.referral_code ?? null,
    isUnlocked: data?.position?.is_unlocked ?? false,
    neighbors: data?.neighbors ?? [],
    isLoading,
    error,
    mutate,
  };
}
```

---

## 5. Where to Hook Up — Component Reference

Every location that renders a `WaitlistPanel` or reads `waitlistPosition` is listed below. Each already has a `TODO` comment pointing to this document.

| File | What it does | What to change |
|---|---|---|
| **`src/components/organisms/WaitlistPanel.tsx`** | Core UI — renders position, neighbors, referral button | Replace `seedRandom` mock logic with `useWaitlist()` hook data. Use `neighbors` array instead of `MOCK_USERNAMES`. Use `referralCode` from the API instead of `generateReferralCode()`. |
| **`src/components/molecules/Header.tsx`** | Shows `#position` badge + hover dropdown | Replace `seedRandom` position calculation with `useWaitlist().position`. |
| **`src/components/organisms/PriceChart.tsx`** | Renders `<WaitlistPanel>` when an issuer is not tradable | No direct API change needed — it just renders `WaitlistPanel` which will self-hydrate via the hook. |
| **`src/app/(main)/account/assets/page.tsx`** | Overlays `<WaitlistPanel expanded>` on the blurred assets table | Same — just renders the panel. Optionally check `isUnlocked` to remove the overlay entirely once the user is unlocked. |
| **`src/app/(main)/account/deposit/page.tsx`** | Overlays `<WaitlistPanel expanded>` on the blurred deposit form | Same as assets — check `isUnlocked` to conditionally show real content. |

### Migration Steps (in order)

1. **Create the `waitlist` table** — write a Supabase migration file.
2. **Add RLS policies** — as described above.
3. **Create the 4 Postgres functions** — `get_waitlist_position`, `get_waitlist_neighbors`, `apply_referral`, `unlock_next_wave`.
4. **Schedule the daily cron job** for `unlock_next_wave`.
5. **Update the `handle_new_user` trigger** to also insert a waitlist row with an auto-incrementing position.
6. **Create the API routes** — `/api/waitlist` and `/api/waitlist/referral`.
7. **Create `useWaitlist` hook** — as shown above.
8. **Update `WaitlistPanel.tsx`** — swap mock data for `useWaitlist()`.
9. **Update `Header.tsx`** — swap `seedRandom` for `useWaitlist().position`.
10. **Add unlock gating** — in assets/deposit pages, check `isUnlocked` and skip the overlay when `true`.
11. **Push to Supabase** — `npx supabase@latest db push`.

---

## 6. Referral Code Copy Button

The copy-to-clipboard flow already works in the frontend. Once the API is live:

- The `referralCode` displayed comes from `useWaitlist().referralCode` (generated server-side on signup).
- When another user signs up and enters the code, call `POST /api/waitlist/referral` with `{ code }`.
- After a successful referral, call `mutate()` on the SWR hook to refresh the caller's new position.

---

## 7. Unlocked State

Once `is_unlocked = true` for a user:

- `WaitlistPanel` should show a "You're in!" message instead of the queue.
- The Header badge could change to a checkmark or green indicator.
- The assets/deposit page overlays should be removed, showing the real content.
- The PriceChart should render the actual chart (already handled by `isTradable` — just need to also gate on `isUnlocked` from the waitlist).
