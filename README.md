# AZBAKU — Business Hotel (portfolio demo)

Full-stack demo hotel booking site: React frontend, Node.js/Express + SQLite backend,
Stripe (test mode) payments, RU/EN/AZ localization, admin dashboard.

## Stack
- **Backend:** Node.js 22+ (`node:sqlite`), Express, express-session, bcrypt, Stripe SDK
- **Frontend:** React 18 + Vite, react-router-dom

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `STRIPE_SECRET_KEY` — from https://dashboard.stripe.com/test/apikeys (use the **test mode** secret key, starts with `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` — see step 3 below on how to get this for local testing

Then run:
```bash
npm run dev
```

The backend starts on `http://localhost:4000` and automatically creates+seeds
`backend/db/hotel.db` on first run (6 room types, 2 reviews, exchange rates, one admin user).

**Default admin login:** `admin@azbakuhotel.com` / `ChangeMe123!` — change this password before
showing this to anyone, either by editing `backend/db/db.js`'s seed block and deleting `hotel.db`
to reseed, or by adding a proper "change password" admin route later.

## 2. Frontend setup

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Vite is already configured (`vite.config.js`) to proxy any
`/api/...` request to the backend on port 4000, so the React app can just call `fetch('/api/rooms')`
without worrying about CORS or ports.

## 3. Testing Stripe payments locally (test mode, no real charges)

Stripe needs to send a webhook back to your server when a payment succeeds, so it can mark the
booking as "confirmed" instead of "pending". Locally, your machine doesn't have a public URL for
Stripe to reach — the fix is the **Stripe CLI**:

1. Install the Stripe CLI: https://docs.stripe.com/stripe-cli (there's a package for Windows/Mac/Linux)
2. Run `stripe login` (opens a browser to link your Stripe account)
3. Run:
   ```bash
   stripe listen --forward-to localhost:4000/api/bookings/webhook
   ```
4. It prints something like `whsec_xxxxx` — paste that into your backend `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart the backend (`npm run dev` again) so it picks up the new secret

Now when you complete a test checkout, use Stripe's test card:
- Card number: `4242 4242 4242 4242`
- Expiry: any future date (e.g. `12/28`)
- CVC: any 3 digits
- ZIP: any value

The booking will flip from `pending` to `confirmed` in the admin dashboard once the webhook fires
(you'll see it logged in the terminal running `stripe listen`).

## 4. Checking translations are complete

Before adding new UI text, always add the key to **all three** files in `frontend/src/i18n/`
(`ru.json`, `en.json`, `az.json`) — never hardcode visible text directly in a component.

Run this any time to make sure nothing was missed:
```bash
cd frontend
node scripts/check-i18n-keys.js
```

## 5. What's a demo shortcut vs. what's "real"

Being upfront about what's simplified here, since this is a portfolio piece:

- **Photos** — all photo paths point to `/images/...` placeholders that don't exist yet. Add real
  photos to `frontend/public/images/rooms/` and `frontend/public/images/gallery/` matching the
  filenames referenced in `backend/db/db.js` (rooms) and `frontend/src/pages/Gallery.jsx`.
- **Exchange rates** — hardcoded in `backend/db/db.js` (`exchange_rates` table) and mirrored in
  `frontend/src/context/CurrencyContext.jsx`. Fine for a demo; swap for a live FX API call for
  a real client that cares about accuracy.
- **Stripe billing currency** — Stripe Checkout doesn't support AZN directly, so the actual charge
  goes through in USD (converted from the AZN price) while the AZN amount stays the "source of
  truth" stored in the database. This is called out in a code comment in `routes/bookings.js`.
- **Admin password** — change the seeded default before ever deploying this anywhere public.

## 6. Deploying (when ready)

Same pattern as the LUXE MAISON project: backend can go on Render (Node service), frontend can
either be a static Render/Vercel/Netlify deploy of `npm run build`'s `dist/` folder, or served
directly by Express with a small static-file middleware if you want a single deployed service.
Ask me when you get there and we'll go through it step by step.
