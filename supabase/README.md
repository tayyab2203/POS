# Supabase setup (Phase 8A)

## 1. Apply schema

1. Open your Supabase project → **SQL Editor**.
2. Paste and run [`schema.sql`](./schema.sql).

## 2. Bootstrap the first Super Admin

1. Create an Auth user in **Authentication → Users** (email + password).
2. Run:

```sql
insert into public.profiles (id, shop_id, role, full_name, phone)
values ('<AUTH_USER_UUID>', null, 'super_admin', 'Platform Admin', '');
```

## 3. Frontend env

Copy [`.env.example`](../.env.example) to `.env.local`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable.

## 4. Deploy `create-shop-owner` Edge Function

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-shop-owner
```

Edge runtime already exposes `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for linked projects. If needed:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 5. Call the function (super_admin JWT required)

`POST /functions/v1/create-shop-owner` with `Authorization: Bearer <access_token>` and JSON body:

- `shopName`, `ownerName`, `ownerPhone`, `businessType` (`food`|`retail`|`bakery`)
- `plan` (`basic`|`pro`), `trialDays` (default 14)
- `email`, `password`
- optional `featureFlags`

## 6. Super Admin portal (Phase 8D)

Sign in with a `super_admin` profile — the app opens `/admin`:

- KPI dashboard, shop directory, filters, search
- Onboard shop (calls `create-shop-owner`)
- Renew / suspend / reactivate, log payments, feature flags
- Offline unlock code generator (`POS-YYYYMMDD-XXXXXX`)
- Live sidebar counts (requires Realtime on `shops` + `subscription_payments`)

If live updates do not appear: Supabase Dashboard → **Database → Publications → supabase_realtime** → enable `shops` and `subscription_payments` (also in `schema.sql`).

## Notes

- App billing/POS stays offline-first via Dexie; cloud sync is Phase 8B+.
- Shop users can update profile columns on `shops` only; billing fields are blocked by trigger unless `super_admin`.
