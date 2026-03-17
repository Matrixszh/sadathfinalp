# Firebase Admin Login Setup

## 1) Create Firebase Project

1. Open Firebase Console.
2. Click **Add project** and create a new project.
3. Open **Project settings**.

## 2) Register Web App

1. In Project settings, under **Your apps**, click **Web**.
2. Register app and copy config values.
3. Add these to `.env`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
```

## 3) Enable Authentication

1. Firebase Console → **Authentication** → **Get started**.
2. **Sign-in method** tab → enable **Email/Password**.
3. Add admin users in **Users** tab.

## 4) Authorized Domains

1. Authentication → **Settings** → **Authorized domains**.
2. Add local/dev domains:
   - `localhost`
   - your dev preview domain if used
3. Add production domain:
   - your Vercel domain

## 5) Password Reset Email Template

1. Authentication → **Templates**.
2. Edit **Password reset** template:
   - App name
   - Reply-to email
   - Optional branding

## 6) Rate Limiting and Anti-Abuse

1. Firebase Authentication has built-in abuse protections.
2. In Authentication settings, ensure suspicious requests are blocked.
3. For stronger protection, enable:
   - App Check for web app
   - Cloud Armor / WAF at edge (if available)
   - Login attempt monitoring in Firebase usage dashboard
4. Client handles `auth/too-many-requests` and shows lockout-style message.

## 7) Session Persistence and Token Refresh

- Remember-me checked: browser local persistence.
- Remember-me unchecked: session persistence.
- App performs token refresh periodically and syncs token cookie.

## 8) App Integration Points

- Firebase init and persistence: `src/lib/firebase/client.ts`
- Auth state + login/logout/reset + refresh: `src/components/AuthProvider.tsx`
- Admin route guard: `src/components/AdminAuthGate.tsx`
- Admin layout protection: `src/app/(admin)/layout.tsx`
- Login page UI: `src/app/login/page.tsx`
- Logout action: `src/components/Sidebar.tsx`

## 9) Security Notes

- Keep Firebase keys in env files only.
- Do not commit real credentials.
- In Vercel, add all `NEXT_PUBLIC_FIREBASE_*` variables and redeploy.
- Restrict admin access to known users created in Firebase Auth.

## 10) Validation Checklist

1. Open `/login` and sign in with valid admin email/password.
2. Verify redirect to dashboard.
3. Open admin pages directly while logged out and confirm redirect to `/login`.
4. Test wrong password error.
5. Test network offline error.
6. Trigger multiple failed attempts and verify lockout-style message.
7. Test Forgot password link and email delivery.
