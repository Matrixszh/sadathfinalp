"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, type User, onIdTokenChanged, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let auth: Auth | null = null;
if (hasFirebaseConfig) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch {
    auth = null;
  }
}
export { auth, hasFirebaseConfig };

export async function configurePersistence(remember: boolean) {
  if (!auth) throw new Error("firebase_auth_not_configured");
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

export function setTokenCookie(token: string) {
  if (typeof document === "undefined") return;
  document.cookie = `firebaseIdToken=${token}; path=/; max-age=3600; samesite=lax`;
}

export function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "firebaseIdToken=; path=/; max-age=0; samesite=lax";
}

export function subscribeTokenCookieSync() {
  if (!auth) return () => {};
  return onIdTokenChanged(auth, async (user: User | null) => {
    if (!user) {
      clearTokenCookie();
      return;
    }
    const token = await user.getIdToken();
    setTokenCookie(token);
  });
}
