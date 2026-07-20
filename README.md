# 🍔 BeeMacQueue

> "Because nobody should waste their lunch break staring at a counter."

We've all been there — standing in a crowded Jollibee or McDonald's, clutching a number, unsure if you'll get your meal in 5 minutes or 25. Time slips away. Your break ends. You settle for something cold.

BeeMacQueue changes that.

Born in the busy streets of Cagayan de Oro City, this app puts the power back in your hands. See the queue before you walk in. Join from your phone. Get notified when it's your turn. Spend those extra minutes however you want — not glued to a ticket number.

For the hardworking crew behind the counter, BeeMacQueue brings calm to the chaos. Manage your branch with clarity. Call customers with a tap. Focus on what matters: serving hot meals with a smile.

Real-time queue management for Jollibee and McDonald's branches in CDO. Built with ❤️ and a lot of chickenjoy cravings.

Built with Expo, React Native, Expo Router, Supabase, and TypeScript.

---

## ✅ What this app does

- 🔐 Email, Google, and Facebook authentication
- 🎫 Customers can browse branches, join a queue, and track their ticket status
- 🧑‍💼 Staff can manage queue entries, serve customers, and monitor branch activity
- 🔔 Real-time notifications for queue updates and service completion
- 📱 Supports mobile and web experiences through Expo
- 🏬 Uses branch-based queue flows for Jollibee and McDonald’s locations in CDO

---

## 🛠️ Tech stack

- React Native + Expo SDK 56
- Expo Router for navigation
- Supabase for authentication, database, and realtime updates
- TypeScript
- Async storage and secure storage for session persistence
- Expo Notifications, Image Picker, and Web Browser support

---

## 🚀 Local setup

### 1. Prerequisites

Make sure the following are installed:

```bash
node --version
npm --version
git --version
```

### 2. Create a Supabase project

1. Create a project at Supabase
2. Copy your project URL and anon key from Settings → API
3. Create a .env file in the project root using the example file

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the app

Web:

```bash
npm run web
```

Android/iOS:

```bash
npm start
```

### 5. Optional: enable OAuth providers

If you want Google or Facebook sign-in, enable those providers in Supabase Authentication and configure the redirect URL:

```text
https://your-project.supabase.co/auth/v1/callback
```

---

## 📁 Project structure

The current app uses Expo Router route groups instead of a legacy tabs folder.

```text
app/
  _layout.tsx
  (auth)/
    login.tsx
    register.tsx
    forgot-password.tsx
  (customer)/
    home.tsx
    my-queue.tsx
    notifications.tsx
    profile.tsx
  (staff)/
    dashboard.tsx
    my-queue.tsx
    notifications.tsx
    profile.tsx
components/
context/
hooks/
lib/
types/
```

---

## 🧱 Database notes

The repository includes a schema reference in [database_schema.txt](database_schema.txt), but there is no single SQL setup script file in the project at the moment. You will need to create the required Supabase tables and policies based on your own setup flow.

The app expects tables such as:

- profiles
- establishments
- queue_entries
- notifications
- queue_settings
- staff_activity_log
- wait_time_history

---

## 🔧 Useful scripts

```bash
npm start
npm run web
npm run android
npm run ios
npm run build:web
npm run lint
```

---

## 👥 User roles

- Customer: browse branches, join queues, view notifications, and track their ticket
- Staff: manage branch queue activity, serve customers, and review queue status

---

## 💡 Notes

- The app is designed around real-time Supabase subscriptions for queue and notification updates.
- Authentication is handled through Supabase and the app routes users to either the customer or staff experience based on their profile role.
- The README here reflects the current project structure and available screens in this repository.
