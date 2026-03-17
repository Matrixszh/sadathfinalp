"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

function mapAuthError(code: string) {
  if (code.includes("invalid-credential")) return "Invalid email or password.";
  if (code.includes("wrong-password")) return "Invalid email or password.";
  if (code.includes("user-not-found")) return "No account found for this email.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection and retry.";
  return "Login failed. Please try again.";
}

function normalizeAuthError(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    return String((err as { code?: unknown }).code || "unknown");
  }
  if (typeof err === "object" && err && "message" in err) {
    return String((err as { message?: unknown }).message || "unknown");
  }
  return "unknown";
}

function LoginForm() {
  const { user, loading, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await login(email, password, remember);
      router.replace(next);
    } catch (err: unknown) {
      setError(mapAuthError(normalizeAuthError(err)));
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setInfo("Password reset email sent. Please check your inbox.");
    } catch (err: unknown) {
      setError(mapAuthError(normalizeAuthError(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to access the dashboard.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <label className="inline-flex items-center gap-2 text-gray-700">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" onClick={onForgotPassword} className="text-blue-600 hover:underline">
              Forgot password?
            </button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {info ? <p className="text-sm text-green-600">{info}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-70"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="text-xs text-gray-500">
          Back to <Link href="/" className="text-blue-600 hover:underline">home</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-sm text-gray-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
