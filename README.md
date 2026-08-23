# DishAR

> AR Table Menu: put your menu on the table.

A multi-tenant web application for restaurants. Upload 3D-scanned dish models (GLB/USDZ), generate a table QR code, and let customers view any dish in true-to-scale AR directly in their phone browser.

## Table of Contents
 
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Security](#security)

## Features

- **Browser-based AR** — Uses [`<model-viewer>`](https://modelviewer.dev) to render GLB/USDZ models via WebXR (Chrome/Android), Scene Viewer (Android), and Quick Look (iOS)
- **No app install** — Customers scan a QR code and view dishes in AR instantly
- **Multi-tenant** — Each restaurant owner gets isolated data with strict Row Level Security (RLS)
- **Dashboard** — Manage dishes, reorder, toggle availability, and view analytics
- **QR code generation** — Download printable QR codes for each table
- **Procedural 3D models** — Built-in demo model generator for testing without pre-scanned assets
- **Analytics** — Track menu scans and dish views per restaurant

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| 3D/AR | [`<model-viewer>`](https://modelviewer.dev) 4.3 |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage) |
| Deployment | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone <repo-url>
cd DishAR
npm install
```

### Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` is server-only and used for analytics writes that bypass RLS. Never prefix it with `NEXT_PUBLIC_` or use it in client code.

### Database Setup

Run the 6 SQL migrations in `supabase/migrations/` in order against your Supabase project. These create the `restaurants`, `dishes`, and `menu_events` tables, RLS policies, the `menu-assets` storage bucket, and security functions.

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Restaurant Owners

1. **Sign up** and create a restaurant with a unique URL slug
2. **Upload dishes** — name, price, category, thumbnail image, and a GLB 3D model (USDZ optional for iOS support)
3. **Manage** from the dashboard — reorder, show/hide, edit, or delete dishes
4. **Download a QR code** pointing to your public menu at `/r/<slug>`

### Customers

1. Scan the table QR code to open the restaurant's menu in the browser
2. Tap any dish to view it in AR at true-to-scale
3. On supported phones, tap **View in AR** to place the dish in the real world

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Restaurant owner dashboard
│   │   ├── dish-form.tsx
│   │   ├── dish-list.tsx
│   │   ├── qr/             # QR code download page
│   │   └── settings/       # Restaurant settings
│   ├── login/              # Sign in
│   ├── register/           # Sign up
│   ├── onboarding/         # Create your restaurant
│   ├── r/[slug]/           # Public menu + dish detail (AR viewer)
│   └── api/demo-model/     # Procedural GLB/PNG generator
├── components/
│   └── ar-viewer.tsx       # <model-viewer> wrapper
├── lib/
│   ├── auth.ts             # Auth helpers
│   ├── actions/            # Server actions (CRUD)
│   └── supabase/           # Supabase clients (server, client, public, admin)
└── proxy.ts                # Next.js middleware (session refresh, route guards)
supabase/
└── migrations/             # SQL migrations (tables, RLS, storage, triggers)
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Security

- **RLS** on all tables — restaurant owners can only access their own data
- **4 Supabase client variants** — server (cookie auth), client (browser), public (read-only), admin (service role)
- **Middleware** enforces route guards — protected routes redirect to login; auth routes redirect to dashboard
- **Storage policies** enforce path-based ownership under `restaurants/<id>/`
- **Content policy trigger** rejects uploads with disallowed file extensions
