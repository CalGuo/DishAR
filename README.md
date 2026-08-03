# AR Restaurant Menu

A multi-tenant web app where restaurants upload 3D-scanned dish models and customers scan a table QR code to view any dish in true-to-scale AR — right in their phone browser, no app install required.

## Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage)
- **3D/AR**: [\<model-viewer\>](https://modelviewer.dev) for GLB/USDZ rendering
- **QR**: `qrcode` library for generating downloadable PNG codes
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd restaurant-menu-visualizer
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Run the Supabase migrations in order (see `supabase/migrations/`) to create the `restaurants` and `dishes` tables, storage bucket, and RLS policies.

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

### Restaurant Owners

- **Register** an account and create a restaurant with a unique URL slug
- **Upload dishes** with a name, price, category, thumbnail image, and a GLB 3D model (USDZ optional for iOS)
- **Manage** dishes from the dashboard — reorder, show/hide, edit, or delete
- **Download a QR code** that points to the public menu (`/r/<slug>`)

### Customers

- Scan the table QR code to open the restaurant's public menu in the browser
- Tap any dish to view it in AR at true-to-scale using `<model-viewer>`
- On supported phones, tap **View in AR** to place the dish in the real world

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Authenticated restaurant owner UI
│   │   └── qr/             # QR code download page
│   ├── login/               # Sign in
│   ├── register/            # Sign up
│   ├── onboarding/          # Create your restaurant
│   └── r/[slug]/            # Public menu + dish detail (AR viewer)
├── components/
│   └── ar-viewer.tsx        # <model-viewer> wrapper
├── lib/
│   ├── auth.ts              # Auth helpers
│   ├── actions/             # Server actions (CRUD for restaurants & dishes)
│   └── supabase/            # Supabase client setup (server, client, public, middleware)
└── proxy.ts                 # Next.js middleware (session refresh, route guards)
supabase/
└── migrations/              # SQL migrations (tables, RLS, storage, triggers)
```

## Data Model

- **restaurants** — `id`, `slug` (unique, URL-safe), `name`, `logo_url`, `owner_user_id`
- **dishes** — `id`, `restaurant_id` (FK), `name`, `description`, `price`, `category`, `thumbnail_url`, `model_glb_url`, `model_usdz_url`, `is_available`, `sort_order`

RLS policies enforce that each restaurant owner can only access their own data. Public menu pages use a `SECURITY DEFINER` function to read restaurant info without exposing sensitive fields.
