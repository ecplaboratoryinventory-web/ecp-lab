"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!token || !email) { setError("Invalid reset link"); return; }

    setLoading(true);
    const res = await fetch("/api/auth/complete-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { setError(data.error); }
    else { setSuccess(true); setTimeout(() => router.push("/auth/login"), 3000); }
  };

  if (!token || !email) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Invalid Link</h1>
        <p className="mt-2 text-sm text-zinc-500">This reset link is invalid or has expired.</p>
        <a href="/auth/reset-password" className="mt-4 inline-block text-sm font-medium text-teal hover:underline">Request a new reset link</a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-teal">Password Reset!</h1>
        <p className="mt-2 text-sm text-zinc-500">Your password has been updated. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Set New Password</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter your new password for {email}</p>
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">New Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" placeholder="Min 6 characters" />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700">Confirm Password</label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-dark focus:outline-none disabled:opacity-50">{loading ? "Updating..." : "Reset Password"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <a href="/auth/login" className="font-medium text-zinc-900 hover:underline">Back to login</a>
      </p>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
