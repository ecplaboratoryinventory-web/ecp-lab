import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f5f9]">
      <header className="border-b border-[#dde4ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-wide text-navy">ECP Inventory Lab</span>
          <Link
            href="/auth/login"
            className="rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-[2.75rem] font-extrabold leading-tight tracking-tight text-navy">
            Laboratory Inventory
            <br />
            Management System
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-silver">
            Engineering Laboratory Inventory Management System for STI College
            Cotabato. Track equipment, manage borrow requests, and streamline
            laboratory operations.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="rounded-lg bg-navy px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-navy-light hover:shadow-lg"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="rounded-lg border-2 border-[#dde4ec] bg-white px-7 py-3 text-sm font-semibold text-slate transition-all hover:border-teal hover:text-teal"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { title: "Equipment Management", desc: "Track and manage laboratory equipment inventory with detailed records and status tracking." },
            { title: "Borrow Requests", desc: "Streamlined borrow and return process for students and faculty with real-time approval workflows." },
            { title: "Reports & Analytics", desc: "Generate reports on equipment usage, maintenance schedules, and laboratory activity logs." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-[#dde4ec] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <h3 className="text-lg font-bold text-navy">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-16 border-t border-[#dde4ec] py-5 text-center text-xs text-silver">
        STI College Cotabato — Engineering Laboratory
      </footer>
    </div>
  );
}
