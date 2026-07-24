"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FlaskConical } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "faculty") {
      router.replace("/faculty/dashboard");
    } else {
      router.replace("/admin/dashboard");
    }
  };

  return (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Background with overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundColor: "#ecf0f1" }}
      />
      <div className="fixed inset-0 z-[1]" style={{ background: "rgba(236, 240, 241, 0.78)" }} />

      {/* Login card wrapper */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-5">
        <div className="flex w-full max-w-[820px] overflow-hidden rounded-md border border-[#cdd3d4] bg-white shadow-lg" style={{ minHeight: 480 }}>
          {/* LEFT PANEL — Navy branding */}
          <div className="relative flex w-[320px] flex-col justify-between overflow-hidden p-[50px_38px]" style={{ background: "#2c3e50" }}>
            <div>
              <div className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-md border border-white/10 bg-white/10">
                <FlaskConical className="h-7 w-7 text-[#18bc9c]" />
              </div>
              <h2 className="m-0 mb-2.5 text-[1.3rem] font-black tracking-tight text-white">
                ECP Inventory Lab
              </h2>
              <p className="m-0 text-[0.84rem] leading-relaxed text-white/50">
                Manage equipment, track inventory,<br />
                and oversee lab operations<br />
                from one central dashboard.<br /><br />
                Streamline your laboratory workflow<br />
                with real-time tracking and reporting.
              </p>
            </div>
            <div>
              <div className="my-7 h-px bg-white/[0.10]" />
              <ul className="m-0 list-none space-y-2.5 p-0">
                {["Secure authentication", "Role-based access control", "Real-time data synchronization"].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-2.5 text-[0.82rem] text-white/50">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#18bc9c" }} />
                      {t}
                    </li>
                  ),
                )}
              </ul>
            </div>
            {/* Decorative circle */}
            <div
              className="absolute -bottom-[70px] -right-[70px] h-[220px] w-[220px] rounded-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          </div>

          {/* RIGHT PANEL — White form */}
          <div className="flex flex-1 flex-col justify-center bg-white px-[45px] py-11">
            <div className="mb-7">
              <h1 className="m-0 mb-1 text-[1.45rem] font-black" style={{ color: "#2c3e50" }}>
                Login
              </h1>
              <p className="m-0 text-[0.86rem]" style={{ color: "#7b8a8b" }}>
                Sign in to your account to continue
              </p>
            </div>

            {error && (
              <div
                className="mb-[22px] flex items-start gap-2.5 rounded p-[11px_15px] text-[0.85rem]"
                style={{
                  background: "#fdf3f3",
                  border: "1px solid #e2a9a9",
                  borderLeft: "4px solid #e74c3c",
                  color: "#922b21",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2" className="mt-px shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-[14px]">
              <div>
                <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: "#7b8a8b" }}>
                  Email
                </label>
                <div
                  className="flex overflow-hidden rounded border border-[#cdd3d4] transition-colors"
                  style={{ boxShadow: "0 0 0 3px rgba(24,188,156,0)" }}
                >
                  <div className="flex w-10 items-center justify-center border-r border-[#cdd3d4] text-[#95a5a6]" style={{ background: "#f4f6f7" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    className="h-[42px] flex-1 border-none bg-white px-[14px] text-[0.9rem] text-[#2c3e50] outline-none placeholder:text-[#bdc3c7]"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[0.75rem] font-bold uppercase tracking-wider" style={{ color: "#7b8a8b" }}>
                  Password
                </label>
                <div className="flex overflow-hidden rounded border border-[#cdd3d4]">
                  <div className="flex w-10 items-center justify-center border-r border-[#cdd3d4] text-[#95a5a6]" style={{ background: "#f4f6f7" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[42px] flex-1 border-none bg-white px-[14px] text-[0.9rem] text-[#2c3e50] outline-none placeholder:text-[#bdc3c7]"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="flex items-center border-l border-[#e8ecec] bg-transparent px-[13px] text-[#bdc3c7] transition-colors hover:text-[#7b8a8b]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1.5 flex h-[42px] w-full items-center justify-center gap-2 rounded border text-[0.93rem] font-bold tracking-wide text-white transition-colors disabled:opacity-50"
                style={{ background: "#18bc9c", borderColor: "#18bc9c", fontFamily: "'Lato', sans-serif" }}
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-[#ecf0f1] pt-[18px] text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[0.83rem] no-underline transition-colors"
                style={{ color: "#95a5a6" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
