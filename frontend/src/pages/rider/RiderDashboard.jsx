import { riderDashboard } from "../../data/mockData.js";
import { Panel } from "../../components/ui/Panel.jsx";

const plans = [
  { key: "BASIC", premium: 39, cap: 300 },
  { key: "STANDARD", premium: 59, cap: 600 },
  { key: "PRO", premium: 99, cap: 1200 },
  { key: "PREMIUM", premium: 159, cap: 2000 }
];

export default function RiderDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Panel title="Protected This Week" subtitle="Premium stays capped at 2% of expected weekly earnings.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Current Plan</p>
              <p className="mt-2 text-2xl font-semibold">{riderDashboard.rider.plan}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">This Week's Premium</p>
              <p className="mt-2 text-2xl font-semibold">Rs {riderDashboard.premium.recommendedPremium}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Weekly Income Avg</p>
              <p className="mt-2 text-2xl font-semibold">Rs {riderDashboard.rider.weeklyEarningsAverage}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Live Alerts" subtitle="Alerts are system-detected. Riders do not submit claims manually.">
          <div className="space-y-3">
            {riderDashboard.activeAlerts.map((alert) => (
              <div key={alert._id} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{alert.eventType.replaceAll("_", " ")}</p>
                  <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-300">
                    {alert.severity.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{alert.city}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Claims & Payouts" subtitle="Strict sequence: GPS, zone overlap, active delivery, fraud score.">
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/70">
                <tr>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Decision</th>
                  <th className="px-4 py-3 text-left">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {riderDashboard.recentClaims.map((claim) => (
                  <tr key={claim._id}>
                    <td className="px-4 py-3">{claim.eventId.eventType.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">{claim.decision}</td>
                    <td className="px-4 py-3">Rs {claim.cappedPayout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Plan Selection" subtitle="Coverage expands by calamity type, payout speed, and weekly cap.">
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-4 ${
                  plan.key === riderDashboard.rider.plan ? "border-aqua bg-aqua/10" : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{plan.key}</p>
                  <span className="text-sm text-slate-300">Rs {plan.premium}/week</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Weekly max payout: Rs {plan.cap}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Appeal Path" subtitle="High-risk holds request extra evidence instead of instant rejection.">
          <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-300">
            Riders can appeal held or rejected claims with a delivery screenshot or timestamped evidence for human review.
          </div>
        </Panel>
      </div>
    </div>
  );
}

