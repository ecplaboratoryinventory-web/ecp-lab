import Link from "next/link";
import { Microscope, FlaskConical, ShieldCheck, FileText } from "lucide-react";

export default function LandingPage() {
  const slides = [
    "images/background.png",
    "images/landingPage.png",
    "images/Engineering innovation in motion.png",
  ];

  return (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      <style>{`
        :root {
          --navy: #2c3e50;
          --teal: #18bc9c;
          --gold: #f39c12;
          --light: #ecf0f1;
          --muted: #7b8a8b;
          --border: #dde1e3;
        }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b-[3px] border-[#18bc9c]" style={{ background: "var(--navy)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4" style={{ height: 58 }}>
          <Link href="/" className="flex items-center gap-[11px] no-underline">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded border border-white/20 bg-white/10">
              <FlaskConical className="h-5 w-5 text-[#18bc9c]" />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <span className="block text-base font-bold text-white">ECP Inventory Lab</span>
              <small className="text-[0.72rem] font-normal text-white/50">Laboratory Management System</small>
            </div>
          </Link>

          <div className="flex gap-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded px-[18px] py-1.5 text-[0.85rem] font-bold text-white no-underline transition-colors hover:text-white"
              style={{ background: "var(--teal)", border: "1px solid var(--teal)" }}
            >
              <Microscope className="h-3.5 w-3.5" /> Admin
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded px-[18px] py-1.5 text-[0.85rem] font-bold no-underline transition-colors"
              style={{ color: "rgba(255,255,255,0.78)", border: "1px solid rgba(255,255,255,0.28)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Faculty
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-[500px] items-center overflow-hidden py-[72px] text-center">
        <div className="absolute inset-0 z-0" style={{ background: "rgba(44,62,80,0.85)" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <div className="mb-6 inline-flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-white/20 bg-white/5">
            <FlaskConical className="h-12 w-12 text-[#18bc9c]" />
          </div>
          <h1 className="mb-2 text-[2.6rem] font-black leading-tight tracking-tight text-white">
            Engineering Laboratory
            <br />
            Inventory System
          </h1>
          <p className="mb-1 text-lg font-light text-white/60">Track, manage, and monitor laboratory resources</p>
          <p className="mb-8 text-xl font-bold" style={{ color: "var(--gold)" }}>
            STI College Cotabato
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded border-2 px-[30px] py-[11px] text-[0.95rem] font-bold no-underline transition-colors"
              style={{ background: "var(--teal)", borderColor: "var(--teal)", color: "#fff" }}
            >
              Get Started <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded border-2 px-[30px] py-[11px] text-[0.95rem] font-bold no-underline transition-colors"
              style={{ background: "transparent", borderColor: "rgba(255,255,255,0.38)", color: "rgba(255,255,255,0.85)" }}
            >
              Learn More <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="flex flex-wrap justify-center" style={{ background: "var(--teal)" }}>
        {[
          { value: "50+", label: "Equipment" },
          { value: "8", label: "Categories" },
          { value: "200+", label: "Active Users" },
          { value: "500+", label: "Borrows" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="px-9 py-[18px] text-center"
            style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.20)" : "none" }}
          >
            <div className="text-[1.6rem] font-black leading-none text-white">{s.value}</div>
            <div className="mt-[3px] text-[0.7rem] font-bold uppercase tracking-wider text-white/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="bg-white py-[72px]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-11 text-center">
            <h2 className="mb-2 text-[1.75rem] font-black" style={{ color: "var(--navy)" }}>
              Key Features
            </h2>
            <p className="text-[0.95rem]" style={{ color: "var(--muted)" }}>
              Everything you need to manage your laboratory efficiently
            </p>
            <div className="mx-auto mt-3 h-[3px] w-10 rounded" style={{ background: "var(--teal)" }} />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Microscope, title: "Equipment Management", desc: "Track and manage all laboratory equipment with detailed records, status tracking, and QR code generation.", bg: "#d6eaf8", color: "#1a5276" },
              { icon: FlaskConical, title: "Borrow Tracking", desc: "Streamlined borrow and return process for students and faculty with real-time status updates and notifications.", bg: "#d5f5e3", color: "#1d6a3a" },
              { icon: ShieldCheck, title: "Real-time Monitoring", desc: "Monitor equipment availability, maintenance schedules, and overdue returns with live dashboard updates.", bg: "#fdebd0", color: "#a04000" },
              { icon: FileText, title: "Reports & Analytics", desc: "Generate comprehensive reports on equipment usage, borrowing trends, and laboratory activity logs.", bg: "#fce8e8", color: "#922b21" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex h-full flex-col items-center rounded border border-[#dde1e3] px-5 py-7 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "#f8f9fa", borderTop: "3px solid var(--teal)" }}
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded text-2xl"
                  style={{ background: f.bg, color: f.color }}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h5 className="mb-2.5 text-[0.95rem] font-bold" style={{ color: "var(--navy)" }}>
                  {f.title}
                </h5>
                <p className="text-[0.85rem] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-[72px]" style={{ background: "var(--light)" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4">
          <div className="flex-1" style={{ minWidth: 280 }}>
            <h2
              className="mb-[18px] text-[1.75rem] font-black"
              style={{ color: "var(--navy)" }}
            >
              About the Laboratory
            </h2>
            <p className="mb-3.5 text-[0.93rem] leading-relaxed" style={{ color: "#5a6a7a" }}>
              The Engineering Laboratory at STI College Cotabato provides students with hands-on experience using industry-standard equipment and tools. Our inventory management system ensures that all laboratory resources are properly tracked, maintained, and accessible to both students and faculty members.
            </p>
            <p className="mb-3.5 text-[0.93rem] leading-relaxed" style={{ color: "#5a6a7a" }}>
              From microscopes and glassware to electronic testing equipment and safety gear, every item in our inventory is catalogued and monitored to support the academic excellence of our engineering programs.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded px-[22px] py-2.5 text-[0.88rem] font-bold text-white no-underline transition-colors"
              style={{ background: "var(--navy)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Contact Administrator
            </Link>
          </div>
          <div className="flex items-center justify-center" style={{ minWidth: 150 }}>
            <FlaskConical className="h-32 w-32 opacity-90" style={{ color: "var(--teal)" }} />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-[3px] border-[#18bc9c] py-6 text-center" style={{ background: "var(--navy)" }}>
        <p className="m-0 text-[0.84rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
          &copy; {new Date().getFullYear()} STI College Cotabato — Engineering Laboratory. All rights reserved.
        </p>
        <p className="m-0 mt-1 text-[0.84rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
          Developed by{" "}
          <a href="#" style={{ color: "var(--teal)", textDecoration: "none" }}>
            ECP Laboratory Team
          </a>
        </p>
      </footer>
    </div>
  );
}
