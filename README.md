# 🍔 BeeMacQueue CDO

**Real-time queue management for Jollibee & McDonald's branches in Cagayan de Oro City**

Built with React Native · Expo · Supabase · TypeScript

---

## ✅ Features

- 🔐 Email, Google & Facebook authentication
- 🎫 Real-time queue joining and tracking
- 📊 Live queue progress with estimated wait times
- 🔔 Real-time push notifications (served, cancelled)
- 🛡️ Admin dashboard with live queue monitor
- 🏬 10 CDO branches — Jollibee & McDonald's
- 📱 Works on Android, iOS, and Web browser
- ⚡ 100% real-time via Supabase websockets

---

## 🚀 Step-by-Step Setup

### Step 1 — Prerequisites

Make sure these are installed:

```cmd
node --version    # Must be v18 or higher
npm --version
git --version
```

Install Expo CLI globally:
```cmd
npm install -g expo-cli eas-cli
```

---

### Step 2 — Create Supabase Project

1. Go to **supabase.com** → Sign up → New project
2. Name: `BeeMacQueue`, Region: `Southeast Asia (Singapore)`
3. Wait ~2 minutes for it to initialize
4. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon / public` key

---

### Step 3 — Run the SQL Setup Script

1. In your Supabase project → **SQL Editor → New Query**
2. Open `supabase-setup.sql` from this project
3. Paste the entire contents and click **Run**
4. This creates all tables, RLS policies, realtime, and seeds all 10 CDO branches

---

### Step 4 — Enable OAuth Providers

**Google:**
1. Supabase → Authentication → Providers → Google → Enable
2. Go to console.cloud.google.com → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Paste Client ID + Secret into Supabase

**Facebook:**
1. Supabase → Authentication → Providers → Facebook → Enable
2. Go to developers.facebook.com → My Apps → Create App
3. Add "Facebook Login" product
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Paste App ID + App Secret into Supabase

---

### Step 5 — Configure Environment

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 6 — Install Dependencies

```cmd
cd BeeMacQueue
npm install
```

---

### Step 7 — Run the App

**Web browser:**
```cmd
npx expo start --web
```
Opens at http://localhost:8081

**Android phone (Expo Go):**
```cmd
npx expo start
```
Install Expo Go from Play Store → Scan QR code

**Android emulator:**
```cmd
npx expo start --android
```

---

### Step 8 — Build for Web (Deploy)

```cmd
npx expo export --platform web
```

Output goes to `dist/` folder. Deploy with:

```cmd
# Vercel
npx vercel --prod

# Netlify
netlify deploy --dir dist --prod
```

---

### Step 9 — Build Android APK

```cmd
eas login
eas build:configure
eas build -p android --profile preview
```

Download APK from expo.dev dashboard.

---

## 📁 File Structure

```
BeeMacQueue/
├── app/
│   ├── _layout.tsx           ← Root layout + auth guard
│   ├── (auth)/
│   │   ├── login.tsx         ← Email + Google + Facebook login
│   │   ├── register.tsx      ← Account creation
│   │   └── forgot-password.tsx
│   └── (tabs)/
│       ├── _layout.tsx       ← Bottom tab bar
│       ├── home.tsx          ← Browse & join queues
│       ├── my-queue.tsx      ← Active ticket + history
│       ├── notifications.tsx ← Real-time alerts
│       ├── profile.tsx       ← Edit profile, change password
│       └── admin.tsx         ← Admin-only dashboard
├── components/
│   ├── ui.tsx                ← Shared UI primitives
│   ├── EstablishmentCard.tsx ← Branch listing card
│   ├── QueueTicketCard.tsx   ← Active ticket with progress
│   ├── JoinModal.tsx         ← Join queue confirmation
│   └── FilterBar.tsx         ← Brand/status filter chips
├── hooks/
│   ├── useAuth.ts            ← Auth state + operations
│   ├── useEstablishments.ts  ← Branches + realtime
│   ├── useQueue.ts           ← Queue join/leave + realtime
│   ├── useNotifications.ts   ← Notifications + realtime
│   └── useAdminQueue.ts      ← Admin live queue monitor
├── lib/
│   ├── supabase.ts           ← Supabase client
│   └── constants.ts          ← Colors, brand config, branches
├── types/
│   └── index.ts              ← TypeScript interfaces
├── supabase-setup.sql        ← Full DB setup script
├── app.json                  ← Expo config
├── package.json
└── .env.example
```

---

## ⚡ Real-time Architecture

Every hook uses Supabase websocket channels:

| Hook | Channel | Listens to |
|------|---------|-----------|
| `useEstablishments` | `realtime:establishments` | INSERT / UPDATE / DELETE on establishments |
| `useQueue` | `realtime:queue:{userId}` | User's own queue entry changes |
| `useQueue` | `realtime:est-for-queue:{userId}` | Establishment updates for ticket progress |
| `useNotifications` | `realtime:notifs:{userId}` | New notifications for user |
| `useAdminQueue` | `realtime:admin-queue` | All queue entry changes |

When any admin serves a ticket → customer sees notification instantly.
When anyone joins a queue → queue count updates on everyone's screen instantly.

---

## 🏬 CDO Branches Included

**Jollibee:** Divisoria, Limketkai, Carmen, Cogon, Gaisano City  
**McDonald's:** Divisoria, Limketkai, Gaisano City, SM CDO, Centrio

---

## 👥 User Roles

- **Customer** — Browse branches, join queue, track ticket, view history
- **Admin** — All customer features + manage branches, serve tickets, reset queues
