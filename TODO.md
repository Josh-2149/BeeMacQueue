# 🍔 BeeMacQueue CDO - TODO.md

## Project Status: 🟢 Near Complete (95%)

---

## ✅ COMPLETED

### Phase 1-5: Foundation — DONE
- [x] SafeAreaView, Phosphor Icons, Database Schema, Core Features

### Phase 6: Customer Profile — DONE
- [x] CustomerHeader, avatar, stats, edit profile modal, change password, sign out

### Phase 7: Staff Profile — DONE
- [x] StaffHeader, performance stats, team list with online/offline, team modal, info pills

### Phase 8: Profile Pictures — DONE
- [x] Avatar upload, camera/gallery picker, Supabase Storage

### Phase 9: Toast & Modal UI — DONE
- [x] Toast redesign (compact, slide-left, auto-vanish)
- [x] Confirm modal redesign (bottom sheet, green confirm, red cancel outline)

### Phase 10: Brand Logos — DONE
- [x] Jollibee & McDo logos in headers and queue cards

---

## 📋 REMAINING

### Phase 11: Google & Facebook OAuth (Medium)
- [ ] Google OAuth — Cloud Console, Supabase config, signInWithGoogle()
- [ ] Facebook OAuth — Developer App, Supabase config, signInWithFacebook()
- [ ] UI buttons already in place, just need backend wiring

### Phase 12: APK Build & Deployment (High)
- [ ] EAS CLI setup: `eas build:configure`
- [ ] App icon and splash screen
- [ ] Preview APK: `eas build -p android --profile preview`
- [ ] Test on physical device
- [ ] Production AAB for Play Store

### Phase 13: Bug Testing & Polish (High)
- [ ] Full queue flow test (join → serve → complete)
- [ ] Multi-staff simultaneous operations
- [ ] Edge cases (network loss, double-tap, queue full)
- [ ] All empty/loading states verified

### Phase 14: Push Notifications (Low - v2)
- [ ] Firebase Cloud Messaging setup
- [ ] Expo Notifications integration
- [ ] Supabase Edge Functions for push triggers

### Phase 15: Future (v2)
- [ ] QR code queue join
- [ ] Dark mode
- [ ] Customer ratings/feedback
- [ ] Analytics dashboard

---

## 🚨 Known Issues

| # | Issue | Status |
|---|-------|--------|
| 1 | Expo Router state update warning (harmless) | ✅ Suppressed |
| 2 | Old queues show jabecrew1 as creator (historical data) | ✅ Won't fix |
| - | All other known issues resolved | ✅ |

---

**Last Updated:** July 21, 2026
**Completion:** 95%