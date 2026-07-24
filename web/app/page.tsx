"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const slides = [
  "/images/landingPage.png",
  "/images/df80a81e-92eb-4508-8faf-4d519ef73830.png",
  "/images/c42705d7-d4b5-4572-b201-0671e2eee649.png",
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b-[3px] border-[#18bc9c]" style={{ background: "#2c3e50" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4" style={{ height: 58 }}>
          <Link href="/" className="flex items-center gap-[11px] no-underline">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded border border-white/20 bg-white/10">
              <img src="/images/logo-main.jpg" alt="ECP Logo" className="h-6 w-auto" />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <span className="block text-base font-bold text-white">ECP Inventory Lab</span>
              <small className="text-[0.72rem] font-normal text-white/50">STI College Cotabato</small>
            </div>
          </Link>
          <div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 rounded px-[18px] py-1.5 text-[0.85rem] font-bold text-white no-underline transition-colors hover:bg-[#15a589]"
              style={{ background: "#18bc9c", border: "1px solid #18bc9c" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO WITH SLIDER */}
      <section className="relative flex min-h-[500px] items-center overflow-hidden py-[72px] text-center">
        {slides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url(${src})`, opacity: i === currentSlide ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 z-0" style={{ background: "rgba(44,62,80,0.85)" }} />
        <div className="absolute bottom-5 left-1/2 z-[3] flex -translate-x-1/2 gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="h-3 w-3 rounded-full border-2 border-white/30 transition-colors"
              style={{ background: i === currentSlide ? "#18bc9c" : "rgba(255,255,255,0.5)", borderColor: i === currentSlide ? "#18bc9c" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4">
          <h1 className="mb-2 text-[2.6rem] font-black leading-tight tracking-tight text-white">
            ECP Inventory Lab
          </h1>
          <p className="mb-1 text-lg font-light text-white/60">Laboratory Equipment Management System</p>
          <p className="mb-8 text-xl font-bold" style={{ color: "#f39c12" }}>
            STI College Cotabato
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="flex flex-wrap justify-center" style={{ background: "#18bc9c" }}>
        {[
          { value: "247", label: "Items Tracked" },
          { value: "18", label: "Active Users" },
          { value: "99%", label: "Uptime" },
          { value: "4", label: "Departments" },
        ].map((s, i) => (
          <div key={s.label} className="px-9 py-[18px] text-center" style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.20)" : "none" }}>
            <div className="text-[1.6rem] font-black leading-none text-white">{s.value}</div>
            <div className="mt-[3px] text-[0.7rem] font-bold uppercase tracking-wider text-white/70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="bg-white py-[72px]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-11 text-center">
            <h2 className="mb-2 text-[1.75rem] font-black" style={{ color: "#2c3e50" }}>System Features</h2>
            <p className="text-[0.95rem]" style={{ color: "#7b8a8b" }}>Efficiently manage your laboratory equipment and inventory</p>
            <div className="mx-auto mt-3 h-[3px] w-10 rounded" style={{ background: "#18bc9c" }} />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18 18 6"/><circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/></svg>, title: "Equipment Tracking", desc: "Monitor all laboratory equipment with real-time status updates and availability tracking.", bg: "#d6eaf8", color: "#1a5276" },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Z"/><path d="M15 12h5a2 2 0 0 1 2 2v1"/><path d="M8 13V7a4 4 0 0 1 8 0v1"/></svg>, title: "Borrowing System", desc: "Streamlined borrowing and return process for students and faculty members.", bg: "#d5f5e3", color: "#1d6a3a" },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, title: "Maintenance Logs", desc: "Keep track of equipment maintenance schedules and full repair history.", bg: "#fdebd0", color: "#a04000" },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>, title: "Reports & Analytics", desc: "Generate detailed reports and analyze equipment usage patterns.", bg: "#fce8e8", color: "#922b21" },
            ].map((f) => (
              <div key={f.title} className="flex h-full flex-col items-center rounded border border-[#dde1e3] px-5 py-7 text-center transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: "#f8f9fa", borderTop: "3px solid #18bc9c" }}>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <h5 className="mb-2.5 text-[0.95rem] font-bold" style={{ color: "#2c3e50" }}>{f.title}</h5>
                <p className="text-[0.85rem] leading-relaxed" style={{ color: "#7b8a8b" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-[72px]" style={{ background: "#ecf0f1" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4">
          <div className="flex-1" style={{ minWidth: 280 }}>
            <h2 className="mb-[18px] text-[1.75rem] font-black" style={{ color: "#2c3e50" }}>
              About the System
            </h2>
            <p className="mb-3.5 text-[0.93rem] leading-relaxed" style={{ color: "#5a6a7a" }}>
              The <strong>ECP Inventory Lab</strong> is a comprehensive laboratory equipment
              management system designed for <strong>STI College Cotabato</strong>. It provides
              an efficient platform for tracking, borrowing, and maintaining laboratory
              equipment and supplies.
            </p>
            <p className="mb-3.5 text-[0.93rem] leading-relaxed" style={{ color: "#5a6a7a" }}>
              This system ensures that all laboratory resources are properly accounted for,
              reducing losses and improving the overall laboratory experience for both
              students and faculty members.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded px-[22px] py-2.5 text-[0.88rem] font-bold text-white no-underline transition-colors hover:bg-[#1a2b3c]"
              style={{ background: "#2c3e50" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Get Started
            </Link>
          </div>
          <div className="flex items-center justify-center" style={{ minWidth: 150 }}>
            <img src="/images/logo-main.jpg" alt="ECP Laboratory" className="h-auto w-[130px] opacity-90" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-[3px] border-[#18bc9c] py-6 text-center" style={{ background: "#2c3e50" }}>
        <p className="m-0 text-[0.84rem]" style={{ color: "rgba(255,255,255,0.45)" }}>
          &copy; {new Date().getFullYear()} ECP Inventory Lab — STI College Cotabato. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
