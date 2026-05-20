# Delivery Post Studio

Premium dealership software for creating, approving, and publishing customer delivery celebration posts to Instagram and Facebook.

Built with **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase** (auth, database, storage), and **OpenAI** (caption generation). Social publishing uses a **mock publisher** structured for future Meta Graph API integration.

## Features

- Staff login (Supabase Auth)
- Upload 1–10 delivery photos to Supabase Storage
- Delivery details form with consent and platform selection
- AI-generated caption options (3 variants)
- Instagram / Facebook live preview cards
- Editable final caption
- Workflow: **Draft** → **Ready** (approved) → **Posted** / **Failed**
- Mock publish service with post logs (Meta-ready architecture)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/storage.sql`
3. Enable Email auth and create a staff user (Authentication → Users).
4. Copy API keys to `.env.local` (see `.env.local.example`).

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional — fallback captions used if missing)
- `NEXT_PUBLIC_DEALERSHIP_NAME`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your staff user.

## Project structure

```
src/
  app/
    (app)/          # Authenticated routes (dashboard, posts)
    login/          # Staff sign-in
    actions/        # Server actions
    api/            # API routes (caption generation)
  components/       # UI + workflow components
  lib/
    supabase/       # Client, server, middleware
    social/         # Publisher interface, mock + Meta stub
    openai/         # Caption generation
    posts/          # Storage helpers
supabase/
  migrations/       # Database schema + RLS
  storage.sql       # Bucket policies
```

## Database tables

| Table | Purpose |
|-------|---------|
| `profiles` | Staff profile linked to `auth.users` |
| `delivery_posts` | Post metadata, captions, status |
| `delivery_post_photos` | Storage paths per post |
| `social_accounts` | Future Meta page/token storage |
| `post_logs` | Publish attempt history |

## Social publishing (mock)

Publishing is handled by `MockSocialPublisher` in `src/lib/social/mock-publisher.ts`. Set `MOCK_PUBLISHER_FORCE_FAILURE=true` to simulate failures.

To integrate Meta later:

1. Implement `MetaSocialPublisher` in `src/lib/social/meta-publisher.ts`
2. Store tokens in `social_accounts`
3. Switch `getSocialPublisher("meta")` in `src/app/actions/posts.ts`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## License

Private — dealership internal use.
