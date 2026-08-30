"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");
  const email = params.get("email");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const leftTitle = !token || !email ? "Invalid Link" : success ? "All Set!" : "New Password";
  const leftSub = !token || !email
    ? "This link is no longer valid."
    : success
      ? "Password updated successfully."
      : "Choose a strong password\nto secure your account.";

  return (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundColor: "#ecf0f1" }} />
      <div className="fixed inset-0 z-[1]" style={{ background: "rgba(236, 240, 241, 0.78)" }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-5">
        <div className="flex w-full max-w-[820px] overflow-hidden rounded-md border border-[#cdd3d4] bg-white shadow-lg" style={{ minHeight: 480 }}>

          {/* LEFT PANEL */}
          <div className="relative flex w-[320px] flex-col justify-between overflow-hidden p-[50px_38px]" style={{ background: "#2c3e50" }}>
            <div>
              <div className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-md border border-white/10 bg-white/10">
                <Image src="/images/logo-main.png" alt="ECP" width={56} height={56} className="h-14 w-14 object-contain" />
              </div>
              <h2 className="m-0 mb-2.5 text-[1.3rem] font-black tracking-tight text-white">{leftTitle}</h2>
              <p className="m-0 whitespace-pre-line text-[0.84rem] leading-relaxed text-white/50">{leftSub}</p>
            </div>
            <div>
              <div className="my-7 h-px bg-white/[0.10]" />
              <ul className="m-0 list-none space-y-2.5 p-0">
                {["Minimum 6 characters", "Match both fields", "Keep it secure"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-[0.82rem] text-white/50">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#18bc9c" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -bottom-[70px] -right-[70px] h-[220px] w-[220px] rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-1 flex-col justify-center bg-white px-[45px] py-11">
            {!token || !email ? (
              <>
                <div className="mb-7">
                  <h1 className="m-0 mb-1 text-[1.45rem] font-black" style={{ color: "#2c3e50" }}>Invalid Link</h1>
                  <p className="m-0 text-[0.86rem]" style={{ color: "#7b8a8b" }}>This reset link is invalid or has expired.</p>
                </div>
                <a href="/auth/reset-password" className="inline-flex h-[42px] w-fit items-center rounded px-6 text-[0.93rem] font-bold text-white no-underline" style={{ background: "#18bc9c" }}>
                  Request New Link
                </a>
              </>
            ) : success ? (
              <>
                <div className="mb-7">
                  <h1 className="m-0 mb-1 text-[1.45rem] font-black" style={{ color: "#18bc9c" }}>Password Reset!</h1>
                  <p className="m-0 text-[0.86rem]" style={{ color: "#7b8a8b" }}>Redirecting to login&hellip;</p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="m-0 mb-1 text-[1.45rem] font-black" style={{ color: "#2c3e50" }}>Set New Password</h1>
                  <p className="m-0 text-[0.86rem]" style={{ color: "#7b8a8b" }}>{email}</p>
                </div>

                {error && (
                  <div className="mb-[22px] flex items-start gap-2.5 rounded p-[11px_15px] text-[0.85rem]" style={{ background: "#fdf3f3", border: "1px solid #e2a9a9", borderLeft: "4px solid #e74c3c", color: "#922b21" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" className="mt-px shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-[14px]">
                  <div>
                    <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: "#7b8a8b" }}>New Password</label>
                    <div className="group flex overflow-hidden rounded border border-[#cdd3d4] transition-all focus-within:border-[#18bc9c] focus-within:shadow-[0_0_0_3px_rgba(24,188,156,0.14)]">
                      <div className="flex w-10 items-center justify-center border-r border-[#cdd3d4] text-[#95a5a6] group-focus-within:text-[#18bc9c]" style={{ background: "#f4f6f7" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" className="h-[42px] flex-1 border-none bg-white px-[14px] text-[0.9rem] text-[#2c3e50] outline-none placeholder:text-[#bdc3c7]" style={{ fontFamily: "'Lato', sans-serif" }} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="flex items-center border-l border-[#e8ecec] bg-transparent px-[13px] text-[#bdc3c7] transition-colors hover:text-[#7b8a8b]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: "#7b8a8b" }}>Confirm Password</label>
                    <div className="group flex overflow-hidden rounded border border-[#cdd3d4] transition-all focus-within:border-[#18bc9c] focus-within:shadow-[0_0_0_3px_rgba(24,188,156,0.14)]">
                      <div className="flex w-10 items-center justify-center border-r border-[#cdd3d4] text-[#95a5a6] group-focus-within:text-[#18bc9c]" style={{ background: "#f4f6f7" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Re-enter password" className="h-[42px] flex-1 border-none bg-white px-[14px] text-[0.9rem] text-[#2c3e50] outline-none placeholder:text-[#bdc3c7]" style={{ fontFamily: "'Lato', sans-serif" }} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="flex items-center border-l border-[#e8ecec] bg-transparent px-[13px] text-[#bdc3c7] transition-colors hover:text-[#7b8a8b]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1.5 flex h-[42px] w-full items-center justify-center rounded border text-[0.93rem] font-bold tracking-wide text-white transition-colors disabled:opacity-50"
                    style={{ background: "#18bc9c", borderColor: "#18bc9c", fontFamily: "'Lato', sans-serif" }}
                  >
                    {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Reset Password"}
                  </button>
                </form>
              </>
            )}

            <div className="mt-5 border-t border-[#ecf0f1] pt-[18px] text-center">
              <a href="/auth/login" className="inline-flex items-center gap-1.5 text-[0.83rem] no-underline transition-colors" style={{ color: "#95a5a6" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#ecf0f1", fontFamily: "'Lato', sans-serif" }}>
        <div className="text-[#7b8a8b]">Loading...</div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
