import Link from "next/link";

const GREEN = "#2ea653";
const NAVY = "#1b2b40";

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    title: "Equipment & Inventory Management",
    desc: "Manage laboratory equipment records, categories, quantities, condition, availability, location, and subject association.",
    bg: "#e7f7ed",
    color: "#27ae60",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M8 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="9 7 6 10 9 13" />
        <polyline points="15 17 18 14 15 11" />
        <line x1="6" y1="10" x2="18" y2="10" />
        <line x1="6" y1="14" x2="18" y2="14" />
      </svg>
    ),
    title: "Borrowing & Returning",
    desc: "Process borrowing requests, approvals, returns, and monitor transaction history with proper documentation.",
    bg: "#e9f1fb",
    color: "#2f80ed",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    title: "Equipment Condition & Damage Monitoring",
    desc: "Record and assess equipment condition (Good, Damaged, Needs Replacement) and track damage reports with accountability.",
    bg: "#fdf1e2",
    color: "#e5892b",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: "Notifications",
    desc: "Receive in-app and push notifications for approvals, rejections, returns, and reminders.",
    bg: "#f4ecfa",
    color: "#9b59b6",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "User & Access Management",
    desc: "Role-based access for Administrator/Lab Custodian, Designated Faculty, and Students.",
    bg: "#e7f8f6",
    color: "#1abc9c",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <rect x="7" y="10" width="3" height="8" rx="1" />
        <rect x="12" y="6" width="3" height="12" rx="1" />
        <rect x="17" y="13" width="3" height="5" rx="1" />
      </svg>
    ),
    title: "Reporting & Dashboard",
    desc: "Monitor inventory, transactions, overdue items, and generate reports for better decision-making.",
    bg: "#fdeceb",
    color: "#e74c3c",
  },
];

const roles = [
  {
    title: "Administrator / Laboratory Custodian",
    desc: "Manages equipment, inventory, users, transactions, reports, and announcements through the web application.",
    bg: "#e7f7ed",
    color: "#27ae60",
  },
  {
    title: "Designated Faculty",
    desc: "Monitors equipment and inventory, processes borrowing activities, approves requests (when applicable), and manages transactions.",
    bg: "#e9f1fb",
    color: "#2f80ed",
  },
  {
    title: "Students",
    desc: "Browses available equipment, submits borrowing requests, tracks request status, and receives notifications through the mobile application.",
    bg: "#fdf1e2",
    color: "#e5892b",
  },
];

export default function LandingPage() {
  return (
    <div className="w-full">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }
        .ecp-landing h1, .ecp-landing h2, .ecp-landing h5 { font-family: "Lato", sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-[14px]">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded bg-white/10">
              <img src="/images/logo-main.png" alt="ECP Logo" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-[1.5rem] font-black leading-none text-white">ECP</span>
            <div className="h-8 w-px bg-white/20" />
            <div className="hidden md:block" style={{ lineHeight: 1.25 }}>
              <div className="text-[0.84rem] font-bold text-white">
                ECP: A Web-App Engineering Laboratory Management System
              </div>
              <div className="text-[0.8rem] font-bold" style={{ color: GREEN }}>
                STI College Cotabato
              </div>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex shrink-0 items-center gap-1.5 rounded px-[20px] py-2 text-[0.9rem] font-bold text-white transition-colors"
            style={{ background: GREEN }}
          >
            <ArrowIcon /> Log In
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden py-[80px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/background.png)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(27,43,64,0.99) 0%, rgba(27,43,64,0.97) 45%, rgba(33,54,82,0.93) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4">
          <h1 className="mb-4 max-w-3xl text-[2.5rem] font-black leading-[1.15] tracking-tight text-white md:text-[3rem]">
            ECP: A Web-App Engineering Laboratory Management System
          </h1>
          <div className="mb-6 h-[3px] w-16 rounded" style={{ background: GREEN }} />
          <p className="mb-8 max-w-2xl text-[1rem] leading-relaxed text-white/85 md:text-[1.08rem]">
            A centralized system for managing laboratory equipment, inventory, borrowing
            and returning transactions, equipment condition, and laboratory operations at
            STI College Cotabato.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded px-[22px] py-3 text-[0.92rem] font-bold text-white transition-colors"
            style={{ background: GREEN }}
          >
            <ArrowIcon /> Log In to Access the System
          </Link>
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-white py-[72px]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-2 text-[1.8rem] font-black" style={{ color: NAVY }}>
            About ECP
          </h2>
          <div className="mx-auto mb-5 h-[3px] w-14 rounded" style={{ background: GREEN }} />
          <p className="mb-3 font-bold leading-relaxed" style={{ color: NAVY }}>
            ECP is a comprehensive Engineering Laboratory Management System developed for
            STI College Cotabato.
          </p>
          <p className="leading-relaxed" style={{ color: "#5a6a7a" }}>
            It helps the institution efficiently manage laboratory equipment and inventory,
            streamline borrowing and returning processes, monitor equipment condition, and
            promote accountability and efficient laboratory operations.
          </p>
        </div>
      </section>

      {/* CORE SYSTEM FEATURES */}
      <section className="bg-white pb-[72px]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-11 text-center">
            <h2 className="mb-2 text-[1.8rem] font-black" style={{ color: NAVY }}>
              Core System Features
            </h2>
            <div className="mx-auto h-[3px] w-14 rounded" style={{ background: GREEN }} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex h-full items-start gap-4 rounded border border-[#e4e8ec] p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: "#ffffff" }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <div>
                  <h5 className="mb-2 text-[0.98rem] font-bold leading-snug" style={{ color: NAVY }}>
                    {f.title}
                  </h5>
                  <p className="text-[0.86rem] leading-relaxed" style={{ color: "#7b8a8b" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO USES ECP */}
      <section className="py-[72px]" style={{ background: "#f6f8fa" }}>
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-11 text-center">
            <h2 className="mb-2 text-[1.8rem] font-black" style={{ color: NAVY }}>
              Who Uses ECP?
            </h2>
            <div className="mx-auto h-[3px] w-14 rounded" style={{ background: GREEN }} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {roles.map((r) => (
              <div
                key={r.title}
                className="flex h-full flex-col rounded border border-[#e4e8ec] p-6"
                style={{ background: "#ffffff" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{ background: r.bg, color: r.color }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <h5 className="text-[1rem] font-bold leading-snug" style={{ color: NAVY }}>
                    {r.title}
                  </h5>
                </div>
                <p className="text-[0.9rem] leading-relaxed" style={{ color: "#7b8a8b" }}>
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-[72px]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-8 rounded-lg border border-[#e4e8ec] p-7 md:flex-row md:gap-0">
            <div className="flex flex-1 items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "#e7f7ed", color: GREEN }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="mb-1 text-[1.05rem] font-black" style={{ color: NAVY }}>
                  Secure. Reliable. Centralized.
                </div>
                <p className="text-[0.88rem] leading-relaxed" style={{ color: "#7b8a8b" }}>
                  ECP ensures that laboratory resources are properly accounted for, reducing
                  losses and improving the overall laboratory experience for both faculty and
                  students.
                </p>
              </div>
            </div>
            <div className="md:border-l md:border-[#e4e8ec] md:pl-8">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded px-[22px] py-3 text-[0.92rem] font-bold text-white transition-colors"
                style={{ background: GREEN }}
              >
                <ArrowIcon /> Log In to Access the System
              </Link>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[0.8rem] font-semibold md:justify-start" style={{ color: "#7b8a8b" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Only authorized users can access the system.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-[12px]">
            <img src="/images/logo-main.png" alt="ECP Logo" className="h-9 w-9 object-contain" />
            <div style={{ lineHeight: 1.25 }}>
              <div className="text-[0.82rem] font-bold text-white">
                ECP: A Web-App Engineering Laboratory Management System
              </div>
              <div className="text-[0.78rem] font-bold" style={{ color: GREEN }}>
                STI College Cotabato
              </div>
            </div>
          </div>
          <div className="text-[0.8rem]" style={{ color: "rgba(255,255,255,0.6)" }}>
            &copy; {new Date().getFullYear()} ECP - All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
