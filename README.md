# TalaPesa

Loan management software (SaaS) for microlenders, SACCOs and cash lenders in Tanzania. Each lending business signs up, gets its own private workspace, invites its staff, and runs its whole lending operation from TalaPesa: customers, loan applications and approvals, repayment schedules, collections by mobile money, SMS reminders and reports. The interface is in **Kiswahili and English**.

## What it does

| Area | Features |
| --- | --- |
| **Workspaces** | Self-service sign-up, 14-day free trial, one private workspace per business, subscription plans (Starter / Growth / Pro) billed monthly through Selcom, read-only mode when a subscription lapses |
| **Team** | Roles: owner, admin, loan officer, viewer. Invite by link (copy or WhatsApp), change roles, disable access. Every action is written to an activity log |
| **Customers** | Full profile (NIDA, contacts, income, next of kin, guarantor), document uploads (ID, photo, payslip, signed contract), blacklist, duplicate-phone protection, search, CSV export |
| **Loan products** | Flat or reducing-balance interest, % per month or per loan, daily / weekly / every-2-weeks / monthly repayments, amount and term limits, processing fee, late fee (percent or fixed) with grace period |
| **Loans** | Application → approval → disbursement → active / overdue → closed, or rejected / written off. Live schedule preview, per-customer limit of active loans, guarantor rules, loan agreement and statement PDFs |
| **Repayments** | Record cash / M-Pesa / Mixx by Yas / Airtel Money / HaloPesa / bank payments, automatic allocation (late fee → interest → principal, oldest installment first), receipts, reversals, SMS receipts |
| **Mobile money** | Send a payment prompt (USSD push) to the customer's phone through the lender's own Selcom account; paid installments update automatically via webhook |
| **Collections** | "Who to call today": overdue, due today, due this week, with one-tap call and bulk SMS reminders |
| **SMS** | Automatic reminders before the due date, on the due date and when overdue (Beem Africa or Africa's Talking), editable Swahili/English templates, full message log |
| **Reports** | Dashboard (portfolio, PAR30, collections, aging), period reports, performance by loan officer, portfolio by product, collections by method, CSV exports |
| **Platform admin** | `/admin` for you (the SaaS owner): all businesses, plans, monthly revenue, extend trials, set plans, suspend |

Anything that touches money runs on the server (Next.js API routes with the Firebase Admin SDK) inside Firestore transactions. The browser can only **read** its own workspace's data; Firestore security rules block every direct write.

## Tech stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Firebase**: Authentication (email/password + Google), Firestore, Storage
- **Selcom** API gateway for mobile-money collection and subscription billing
- **Beem Africa** or **Africa's Talking** for SMS
- Loan maths in `src/lib/engine/loan.ts` — pure functions with unit tests

```
src/
  app/
    page.tsx                 Landing page + pricing
    (auth)/                  Login, sign-up, password reset
    onboarding/              Create a workspace
    invite/[orgId]/[token]/  Accept a team invitation
    (app)/                   The product (dashboard, customers, loans, collections,
                             payments, SMS, reports, team, settings, billing, activity, admin)
    api/                     Server routes (all writes, webhooks, daily job)
  components/                UI kit, app shell, forms, modals
  lib/
    engine/loan.ts           Schedules, payment allocation, penalties, PAR
    server/                  Auth context, payments, Selcom, SMS, audit
    i18n/                    Kiswahili + English dictionaries
tests/                       Loan engine tests
firestore.rules              Tenant-isolated security rules
storage.rules                Customer document rules
```

## Data model (Firestore)

```
users/{uid}                         → orgId, role
orgs/{orgId}                        → business profile, plan, settings, counters
orgs/{orgId}/members/{uid}          → role, status
orgs/{orgId}/invites/{token}
orgs/{orgId}/products/{id}          → loan products
orgs/{orgId}/customers/{id}
orgs/{orgId}/loans/{id}             → terms, baseSchedule, live schedule & balances
orgs/{orgId}/payments/{id}          → amount, allocation, receipt
orgs/{orgId}/paymentRequests/{id}   → mobile-money prompts
orgs/{orgId}/sms/{id}               → message log
orgs/{orgId}/audit/{id}             → activity log
orgs/{orgId}/invoices/{id}          → subscription invoices
orgs/{orgId}/private/integrations   → Selcom / SMS keys (server only)
paymentOrders/{orderId}             → routes Selcom webhooks (server only)
```

A loan's balance is never edited by hand: it is recalculated from its original schedule plus every completed payment. Reversing a payment simply replays the loan without it.

## Run it locally

Requirements: Node.js 20+, a Firebase project (the existing `esncash` project works).

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000
npm test                       # loan engine tests
```

### Environment variables

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from Firebase console → Project settings → Your apps |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Firebase console → Project settings → Service accounts → Generate new private key, then `base64 -w0 key.json` (macOS: `base64 -i key.json`) |
| `NEXT_PUBLIC_APP_URL` | Public URL, e.g. `https://talapesa.co.tz` (used for invite links and Selcom callbacks) |
| `PLATFORM_ADMIN_EMAILS` | Emails that get the `/admin` console |
| `CRON_SECRET` | Long random string protecting the daily job |
| `SELCOM_API_KEY`, `SELCOM_API_SECRET`, `SELCOM_VENDOR` | **Your** Selcom merchant account, used to bill subscriptions. Leave empty for test mode |

Each lending business enters **its own** Selcom and SMS keys in *Settings → Integrations*. Until they do, mobile payments and SMS run in test mode (simulated and logged, nothing real is sent).

### Firebase setup (one time)

1. **Authentication** → Sign-in method → enable *Email/Password* and *Google*. Add your domain under *Authorized domains*.
2. **Firestore** and **Storage** → create them (region `europe-west` or `africa-south1` is closest to Tanzania).
3. Deploy the rules and indexes:
   ```bash
   npm i -g firebase-tools
   firebase login
   npm run deploy:rules
   ```

## Deploy

**Vercel (recommended):** import the GitHub repo, add the environment variables, deploy. `vercel.json` schedules the daily job (`/api/cron/daily`, 07:00 Tanzania time) which updates overdue loans and late fees, sends SMS reminders, marks lapsed subscriptions and settles any Selcom payments whose webhook was missed. Vercel sends `CRON_SECRET` automatically.

**Elsewhere:** any Node 20 host works (`npm run build && npm start`). Call the daily job yourself, e.g. with Google Cloud Scheduler:

```
GET https://YOUR_DOMAIN/api/cron/daily
Authorization: Bearer <CRON_SECRET>
```

In your Selcom merchant dashboard, the webhook URL is `https://YOUR_DOMAIN/api/webhooks/selcom` (TalaPesa also sends it with each order).

## Plans

Defined in `src/lib/plans.ts` — change prices and limits there.

| Plan | Price / month | Team | Active loans | Auto SMS |
| --- | --- | --- | --- | --- |
| Trial (14 days) | free | 5 | 200 | yes |
| Starter | TZS 35,000 | 2 | 150 | no |
| Growth | TZS 85,000 | 8 | 1,500 | yes |
| Pro | TZS 200,000 | unlimited | unlimited | yes |

## Before going live

- Have a lawyer review the Terms and Privacy pages (`src/app/terms`, `src/app/privacy`) and confirm your obligations under the Bank of Tanzania microfinance regulations and the Personal Data Protection Act.
- Rotate the Firebase web API key restrictions in Google Cloud console to your domain.
- Test one real Selcom payment and one real SMS with small amounts.

## License

See [LICENSE](LICENSE).
