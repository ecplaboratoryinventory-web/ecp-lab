import { resetPasswordAction } from "./actions";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Reset Password</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your email to receive a reset link
          </p>
        </div>

        <form action={resetPasswordAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="you@ecp-lab.edu"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            Send Reset Link
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          <a
            href="/auth/login"
            className="font-medium text-zinc-900 hover:underline"
          >
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
