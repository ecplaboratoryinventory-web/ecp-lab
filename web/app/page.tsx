import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-zinc-900">ECP Lab</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            ECP Laboratory Inventory
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Engineering Laboratory Inventory Management System for STI College
            Cotabato. Track equipment, manage borrow requests, and streamline
            laboratory operations.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div
          id="features"
          className="mt-24 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3"
        >
          {[
            {
              title: "Equipment Management",
              description:
                "Track and manage laboratory equipment inventory with detailed records and status tracking.",
            },
            {
              title: "Borrow Requests",
              description:
                "Streamlined borrow and return process for students and faculty with real-time approval workflows.",
            },
            {
              title: "Reports & Analytics",
              description:
                "Generate reports on equipment usage, maintenance schedules, and laboratory activity logs.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 p-6"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">
        STI College Cotabato — Engineering Laboratory
      </footer>
    </div>
  );
}
