# ☀️ Sunset Breeze Rental

Listing website + online rental application for **8770 Sunset Breeze Dr., Reno NV 89506**.

- **Stack:** Next.js (App Router) · Supabase (photos + application records) · UniOne (email) · deployed on Vercel
- **Repo:** https://github.com/fixmoose/sbreeze.git
- **Convention:** all Supabase tables & buckets are prefixed `SB_`.

---

## What this app does today (Phase 1)

| Page | Path | Purpose |
|------|------|---------|
| Listing | `/` | Marketing page: photos, features, terms, pet/occupancy policy, rental criteria, Nevada disclosures, Fair Housing statement. |
| Apply | `/apply` | Short rental application (no SSN / no document uploads — that happens later via a screening service). |
| Thank you | `/thank-you` | Confirmation after submitting. |
| API | `/api/apply` | Saves the application to Supabase and emails you + the applicant via UniOne. |
| Login / Signup | `/login`, `/signup` | Tenants self-register (email + password). |
| Tenant dashboard | `/dashboard` | Lease summary, automatic PayPal setup, check/ACH info, payment history. |
| Landlord dashboard | `/admin` | Applications, leases, payments ledger, record check/ACH payments, expenses + receipts, year-end Schedule E report. |

Both dashboards are live. See **Phase 2 setup** below for the PayPal + admin steps.

---

## 1. Run it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000. The site renders even before Supabase/UniOne are configured
(photos show a placeholder; the form will error only on submit until env vars are set).

## 2. Configure Supabase (project `mxxabikquupnwvlspzyz`)

1. **SQL:** Dashboard → SQL Editor → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Creates the `SB_applications` table (RLS on; only the server can read/write it).
2. **Photos bucket:** Dashboard → Storage → **New bucket** → name `SB_property_photos`,
   toggle **Public** ON. Upload photos named `01-exterior.jpg`, `02-living.jpg`, … to control order.
3. **Keys:** Dashboard → Project Settings → API. Copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mxxabikquupnwvlspzyz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon** key
   - `SUPABASE_SERVICE_ROLE_KEY` = the **service_role** key *(server-only secret)*

## 3. Configure UniOne email

1. Verify a sender domain/address in the UniOne dashboard.
2. In `.env.local` set `UNIONE_API_KEY`, `UNIONE_FROM_EMAIL` (the verified sender),
   and `UNIONE_API_URL` for your region (`eu1` or `us1`).
3. `APPLICATION_NOTIFY_EMAIL` is where new-application alerts go (default `dejan@haywilson.com`).

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Sunset Breeze rental listing + application"
git branch -M main
git remote add origin https://github.com/fixmoose/sbreeze.git
git push -u origin main
```

## 5. Deploy to Vercel

1. vercel.com → **Add New Project** → import `fixmoose/sbreeze`.
2. Framework preset auto-detects **Next.js** — no build settings needed.
3. **Settings → Environment Variables:** add every key from `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `UNIONE_API_KEY`, `UNIONE_API_URL`, `UNIONE_FROM_EMAIL`, `UNIONE_FROM_NAME`, `APPLICATION_NOTIFY_EMAIL`).
4. **Deploy.** Add your custom domain under Settings → Domains when ready.

---

## Editing the listing

Almost everything you'd want to change — rent, deposit, pet fees, occupancy, criteria,
disclosures, contact info — lives in **one file**: [`data/property.ts`](data/property.ts).
Edit the numbers/text, save, and the whole site updates. Fill in the `[BRACKETED]` items
in the disclosures (owner/manager name, emergency contact) before going live.

## Where applications go

Submissions are stored in the `SB_applications` table and emailed to you. View them in
Supabase → Table Editor → `SB_applications`, or wait for the Phase 2 landlord dashboard.

## Security notes

- The form intentionally **does not** collect SSNs, bank logins, or document uploads.
  Sensitive screening is done by a third party (TransUnion SmartMove / RentPrep) where the
  applicant enters their SSN directly — you never handle it.
- `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret. It is never sent to the browser and
  is gitignored. Never prefix it with `NEXT_PUBLIC_`.

---

## Phase 2 setup — portal, PayPal & taxes

Everything below is **built**. Here's how to turn it on:

### a) Database
Re-run [`supabase/schema.sql`](supabase/schema.sql) (it now also creates `SB_profiles`,
`SB_leases`, `SB_payments`, `SB_expenses`, `SB_utility_bills`). Then create a **private** bucket
named `SB_receipts` (Storage → New bucket → Public **OFF**).

### b) Auth + who is the landlord
- Tenants sign up at `/signup` (email + password). In Supabase → Authentication → Providers,
  the **Email** provider is on by default. For local testing you can disable "Confirm email"
  so logins work instantly.
- Set `ADMIN_EMAILS` to your email. Whoever signs up with that email gets the **landlord**
  dashboard at `/admin`; everyone else is a tenant at `/dashboard`.

### c) Link a tenant to a lease
After a tenant signs up, go to `/admin` → **Add a lease** → enter their email + rent. That
connects their dashboard to a lease so they can pay and you can record payments.

### d) PayPal (automatic monthly rent)
1. Create a **PayPal Business** account.
2. developer.paypal.com → **Apps & Credentials** → create an app → copy **Client ID** + **Secret**
   into `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET`. Keep `PAYPAL_ENV=sandbox` until you've tested.
3. Create a **monthly billing plan** ($2,395/mo). Put its plan id in `PAYPAL_PLAN_ID`.
4. Create a **webhook** pointing to `https://YOUR-DOMAIN/api/paypal/webhook`, subscribe it to
   `PAYMENT.SALE.COMPLETED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`,
   and put its id in `PAYPAL_WEBHOOK_ID`. (Each recurring charge then auto-logs to `SB_payments`.)
- No PayPal yet? The portal still works — tenants pay by **check/ACH** and you click
  **Record payment** in `/admin`. Add PayPal anytime.

### e) NV Energy bills (forwarded to tenant)
The electricity account stays in **your** name (so you keep the solar net-metering credit), and
each NV Energy bill is forwarded to the tenant. In `/admin` → **Log an NV Energy bill** (amount,
month, optional PDF). One submit does two things: adds a deductible **Utilities** expense to the
property **and** forwards the charge to the tenant's dashboard.

**Auto-import:** NV Energy has **no public API**, so true automation needs a trigger. The endpoint
`POST /api/utilities` accepts a bill as JSON with the header `x-import-token: <UTILITY_IMPORT_TOKEN>`.
Practical setup: forward the NV Energy bill email to a parser (Zapier / Make / a Cloudflare Email
Worker) that reads the amount + month and POSTs them. Until you wire that up, logging takes ~10
seconds a month in the dashboard.

### f) Year-end taxes (you = Dejan Obradovic)
- Log expenses (with receipts) in `/admin`, each tagged to a **Schedule E** category.
- The dashboard shows income, expenses by category, and net for the year, and **flags any
  individual you paid ≥ $600** (potential **1099-NEC**). Click **Download Schedule E CSV** to
  hand your accountant a clean summary.
- **Tenants get no year-end form** for a Nevada residential rental. If rent flows through
  PayPal, PayPal may send *you* a 1099-K.
- This is a bookkeeping aid, not tax advice — confirm with your accountant.
