# 🍔 BeeMacQueue CDO - TODO.md

## Project Status: 🟡 In Progress

---

## 📋 PHASE 1: SafeAreaView Fix (HIGH PRIORITY)

### 1.1 Create SafeScreen Component
- [ ] Create `components/SafeScreen.tsx`
- [ ] Add SafeAreaView wrapper with proper insets
- [ ] Export SafeScreen component

### 1.2 Update Auth Screens
- [ ] Update `app/(auth)/login.tsx` - Replace View with SafeScreen
- [ ] Update `app/(auth)/register.tsx` - Replace View with SafeScreen
- [ ] Update `app/(auth)/forgot-password.tsx` - Replace View with SafeScreen

### 1.3 Update Tab Screens
- [ ] Update `app/(tabs)/home.tsx` - Add SafeScreen
- [ ] Update `app/(tabs)/my-queue.tsx` - Add SafeScreen
- [ ] Update `app/(tabs)/notifications.tsx` - Add SafeScreen
- [ ] Update `app/(tabs)/profile.tsx` - Add SafeScreen

### 1.4 Update Components
- [ ] Update `components/ui.tsx` - Add SafeAreaView to ScreenHeader
- [ ] Test all screens for proper safe area padding

---

## 📋 PHASE 2: Remove Admin Features

### 2.1 Delete Admin Files
- [ ] Delete `app/(tabs)/admin.tsx`
- [ ] Delete `hooks/useAdminQueue.ts`

### 2.2 Update Tab Navigation
- [ ] Remove admin tab from `app/(tabs)/_layout.tsx`
- [ ] Update tab icons to use Phosphor
- [ ] Adjust tab order (Home, My Queue, Alerts, Profile)

### 2.3 Update Profile Screen
- [ ] Remove admin section from `app/(tabs)/profile.tsx`
- [ ] Remove admin shortcut button
- [ ] Remove admin role display

### 2.4 Update Types
- [ ] Update `types/index.ts` - Remove 'admin' from UserRole
- [ ] Update `hooks/useAuth.ts` - Remove admin role support

### 2.5 Update Register Screen
- [ ] Remove role selector from `app/(auth)/register.tsx`
- [ ] Set default role to 'customer'

---

## 📋 PHASE 3: Phosphor Icons Migration

### 3.1 Install Phosphor (Already Done ✅)
- [x] `phosphor-react-native` already installed

### 3.2 Update Tab Layout
- [ ] Replace `Ionicons` with Phosphor in `app/(tabs)/_layout.tsx`
- [ ] Use `House`, `Ticket`, `Bell`, `User` icons
- [ ] Add `weight` prop for active/inactive states

### 3.3 Update Components
- [ ] Update `components/ui.tsx` - Replace any icons
- [ ] Update `components/EstablishmentCard.tsx` - Replace any icons
- [ ] Update `components/FilterBar.tsx` - Replace any icons
- [ ] Update `components/JoinModal.tsx` - Replace any icons

### 3.4 Update Auth Screens
- [ ] Update `app/(auth)/login.tsx` - Use Phosphor icons
- [ ] Update `app/(auth)/register.tsx` - Use Phosphor icons

### 3.5 Update Constants
- [ ] Add `ICON_SIZE` constant in `lib/constants.ts`
- [ ] Add `ICON_COLOR` constant in `lib/constants.ts`

---

## 📋 PHASE 4: Database Schema Update

### 4.1 Update Supabase Schema
- [ ] Run `supabase-setup.sql` in Supabase SQL Editor
- [ ] Create `profiles` table
- [ ] Create `establishments` table
- [ ] Create `queue_entries` table
- [ ] Create `notifications` table

### 4.2 Set Up RLS Policies
- [ ] Enable RLS on all tables
- [ ] Create SELECT policies
- [ ] Create INSERT policies
- [ ] Create UPDATE policies
- [ ] Create DELETE policies

### 4.3 Enable Realtime
- [ ] Enable Realtime on `queue_entries`
- [ ] Enable Realtime on `notifications`
- [ ] Enable Realtime on `establishments`

### 4.4 Seed Branches
- [ ] Insert 10 CDO branches
- [ ] Verify all Jollibee branches
- [ ] Verify all McDonald's branches

### 4.5 Test Database
- [ ] Test profile creation
- [ ] Test establishment queries
- [ ] Test queue entry operations
- [ ] Test notification creation

---

## 📋 PHASE 5: Facebook OAuth Configuration

### 5.1 Supabase Configuration
- [ ] Go to Authentication → Providers → Facebook
- [ ] Enable Facebook provider
- [ ] Add App ID from Facebook Developers
- [ ] Add App Secret from Facebook Developers
- [ ] Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 5.2 Facebook Developer Setup
- [ ] Create Facebook App
- [ ] Add "Facebook Login" product
- [ ] Add redirect URI in Facebook console
- [ ] Enable "Client OAuth Login"
- [ ] Enable "Web OAuth Login"

### 5.3 Update Auth Hook
- [ ] Add `signInWithFacebook()` function in `hooks/useAuth.ts`
- [ ] Add `signInWithGoogle()` function (if needed)
- [ ] Handle OAuth callback

### 5.4 Update Login Screen
- [ ] Add Facebook login button in `app/(auth)/login.tsx`
- [ ] Add Google login button (optional)
- [ ] Handle loading states
- [ ] Handle error states

### 5.5 Test OAuth
- [ ] Test Facebook login flow
- [ ] Test redirect handling
- [ ] Test session persistence
- [ ] Test profile creation

---

## 📋 PHASE 6: UI/UX Improvements

### 6.1 Loading States
- [ ] Add skeleton loaders for establishments
- [ ] Add loading state for queue operations
- [ ] Add loading state for profile updates

### 6.2 Error Handling
- [ ] Add error boundaries
- [ ] Add toast notifications for errors
- [ ] Add retry logic for failed requests

### 6.3 Empty States
- [ ] Add empty state for My Queue (no active ticket)
- [ ] Add empty state for Notifications
- [ ] Add empty state for Queue History

### 6.4 Pull to Refresh
- [ ] Add refresh control to Home screen
- [ ] Add refresh control to My Queue screen
- [ ] Add refresh control to Notifications screen

---

## 📋 PHASE 7: Real-time Features

### 7.1 Queue Updates
- [ ] Verify real-time queue position updates
- [ ] Verify real-time queue count updates
- [ ] Verify real-time serving number updates

### 7.2 Notification Updates
- [ ] Verify real-time notification delivery
- [ ] Verify real-time notification count badge
- [ ] Verify notification read/unread state

### 7.3 Establishment Updates
- [ ] Verify real-time branch status updates
- [ ] Verify real-time queue number updates

---

## 📋 PHASE 8: Testing

### 8.1 Authentication Testing
- [ ] Test email/password registration
- [ ] Test email/password login
- [ ] Test Facebook OAuth login
- [ ] Test forgot password
- [ ] Test logout
- [ ] Test session persistence

### 8.2 Queue Testing
- [ ] Test joining queue
- [ ] Test viewing active ticket
- [ ] Test leaving queue
- [ ] Test queue position updates
- [ ] Test queue history

### 8.3 Notification Testing
- [ ] Test receiving notifications
- [ ] Test marking notifications as read
- [ ] Test marking all as read
- [ ] Test notification badge count

### 8.4 Profile Testing
- [ ] Test viewing profile
- [ ] Test editing name
- [ ] Test changing password
- [ ] Test queue count updates

### 8.5 Real-time Testing
- [ ] Test real-time queue updates
- [ ] Test real-time notifications
- [ ] Test real-time establishment updates

---

## 📋 PHASE 9: Deployment

### 9.1 Environment Setup
- [ ] Configure production environment variables
- [ ] Set up production Supabase project
- [ ] Run database migrations

### 9.2 Build for Web
- [ ] Run `npm run build:web`
- [ ] Test production build locally
- [ ] Deploy to Vercel/Netlify

### 9.3 Build for Android
- [ ] Configure EAS Build
- [ ] Build APK
- [ ] Test on physical device
- [ ] Submit to Play Store (optional)

---

## ✅ Completed Items

- [x] Project initialized
- [x] Dependencies installed
- [x] SDK 56 upgrade completed
- [x] Phosphor icons installed
- [x] Supabase client configured
- [x] Auth flow structure in place
- [x] Queue operations implemented
- [x] Real-time subscriptions set up
- [x] All screens created
- [x] TypeScript types defined

---

## 🚨 Blockers

1. **SafeAreaView** - Not properly implemented
2. **Admin Removal** - Still integrated in multiple places
3. **Phosphor Icons** - Not yet used
4. **Database Schema** - Not matching types
5. **Facebook OAuth** - Not configured

---

## 📝 Notes

- Keep `useAdminQueue.ts` if you plan to restore admin features later
- Phosphor icons already installed, just need to replace imports
- Database schema needs to be updated before testing CRUD operations
- Facebook OAuth requires developer account and app registration

---

## 🔗 Useful Links

- [Phosphor Icons](https://phosphoricons.com/)
- [Expo SafeAreaView](https://docs.expo.dev/versions/latest/sdk/safe-area-context/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

**Last Updated:** July 15, 2026  
**Project:** BeeMacQueue CDO  
**SDK Version:** 56