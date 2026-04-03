import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("SIGNUP");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "RIDER",
    provider: "ZOMATO",
    city: "",
    zoneCode: "",
    upiId: "",
    aadhaarVerified: false
  });

  const isSignup = mode === "SIGNUP";
  const isRider = form.role === "RIDER";

  useEffect(() => {
    if (mode === "SIGNUP" && form.role !== "RIDER") {
      setForm((current) => ({ ...current, role: "RIDER" }));
    }
  }, [mode, form.role]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(form);
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Unable to authenticate right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="glass rounded-[2rem] p-8 shadow-panel">
          <p className="text-sm uppercase tracking-[0.35em] text-aqua">WEMA Access</p>
          <h2 className="mt-4 text-4xl font-bold text-white">Sign up or sign in as the role you actually use</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Riders can enroll into a plan and track payouts. Admins can review social triggers, fraud flags, and payout queues.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <p className="text-lg font-semibold text-white">Rider</p>
              <p className="mt-2 text-sm text-slate-300">
                Plan selection, alerts, payout history, and claim appeals.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <p className="text-lg font-semibold text-white">Admin</p>
              <p className="mt-2 text-sm text-slate-300">
                Social disruption approvals, fraud review, queue monitoring, and analytics. Admin access is manual-only.
              </p>
            </div>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-8 shadow-panel">
          <div className="mb-6 flex gap-3">
            {["SIGNUP", "LOGIN"].map((item) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === item ? "bg-aqua text-slate-950" : "bg-slate-900/70 text-slate-300"
                }`}
                onClick={() => setMode(item)}
                type="button"
              >
                {item === "SIGNUP" ? "Sign Up" : "Login"}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "SIGNUP" ? (
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                placeholder="Full name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            ) : null}

            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />

            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required={mode === "SIGNUP"}
            />

            {!isSignup && form.role === "ADMIN" ? (
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                placeholder="Admin password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {isSignup ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  New public signups are created as riders only.
                </div>
              ) : (
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  <option value="RIDER">Rider login</option>
                  <option value="ADMIN">Admin login</option>
                </select>
              )}

              {isRider ? (
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                  value={form.provider}
                  onChange={(event) => updateField("provider", event.target.value)}
                >
                  <option value="ZOMATO">Zomato</option>
                  <option value="SWIGGY">Swiggy</option>
                </select>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                  Admin accounts are not created here. Use a manually provisioned admin email to log in.
                </div>
              )}
            </div>

            {isRider ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    placeholder="City"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    required={isSignup}
                  />
                  <input
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    placeholder="Zone code"
                    value={form.zoneCode}
                    onChange={(event) => updateField("zoneCode", event.target.value)}
                    required={isSignup}
                  />
                </div>

                <input
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
                  placeholder="UPI ID"
                  value={form.upiId}
                  onChange={(event) => updateField("upiId", event.target.value)}
                  required={isSignup}
                />

                <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.aadhaarVerified}
                    onChange={(event) => updateField("aadhaarVerified", event.target.checked)}
                    required={isSignup}
                  />
                  I confirm Aadhaar verification is completed
                </label>
              </>
            ) : null}

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              className="w-full rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Please wait..." : mode === "SIGNUP" ? "Create account" : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
