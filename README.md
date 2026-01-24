# SwipeLearn

SwipeLearn is a Tinder-style micro-learning app. Users swipe through 60-second lessons, save favorites, mark lessons learned, and build streaks.

## Stack
- Next.js (App Router) + TypeScript + TailwindCSS
- shadcn/ui components + lucide-react icons
- framer-motion for swipe gestures
- Supabase (Postgres + Auth)

## Setup
1) Install dependencies
```bash
npm install
```

2) Create env file
```bash
cp .env.example .env.local
```
Add your Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3) Create database schema
- Open Supabase SQL editor and run `supabase/schema.sql`.

4) Seed lessons
```bash
npm run seed
```

5) Start dev server
```bash
npm run dev
```

## Supabase tables
- `lessons`
- `user_lesson_actions`
- `user_profile`

## Auth
Email/password via Supabase Auth (client-side). Ensure email auth is enabled in Supabase.

## Notes
- Daily deck selects 10 lessons and excludes those actioned today.
- Streak updates when a user marks at least one lesson as learned each day.
- Use keyboard arrows on `/learn`: left = skip, right = learned, up = deep dive.
- PWA install works when hosted over HTTPS and `public/manifest.json` is reachable. Replace the SVG icon with PNG sizes for best install support.
- New users pick categories on `/onboarding` to personalize their deck.

## Push notifications (PWA)
1) Generate VAPID keys (locally):
```bash
npx web-push generate-vapid-keys
```
2) Add env vars:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourdomain.com
REMINDER_CRON_SECRET=...
```
3) Run the updated SQL schema to create `push_subscriptions`.
4) Install the app as a PWA, then enable push in `/profile`.
5) Schedule a daily POST to `/api/push/send-daily` with header:
```
Authorization: Bearer <REMINDER_CRON_SECRET>
```
Use your host cron, Supabase scheduled functions, or an external scheduler.

## Admin
- Visit `/admin` to create lessons or import a JSON batch.
- Add admins by inserting their `user_id` into `public.admin_users`.
```sql
insert into public.admin_users (user_id) values ('your-user-uuid-here');
```

## Scripts
- `npm run seed` inserts 60 sample lessons.

## Project structure
- `app/` routes and layouts
- `components/` UI and lesson components
- `lib/` Supabase client and types
- `supabase/schema.sql` database schema
- `scripts/seed.ts` seed script
