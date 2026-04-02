import { adminDashboard } from "../../data/mockData.js";
import { Panel } from "../../components/ui/Panel.jsx";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(adminDashboard.metrics).map(([label, value]) => (
          <Panel key={label} title={label.replace(/([A-Z])/g, " $1")} className="min-h-[120px]">
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Active Event Map Queue" subtitle="Weather events auto-approve. Social triggers wait for admin action.">
          <div className="space-y-3">
            {adminDashboard.activeEvents.map((event) => (
              <div key={event._id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{event.city}</p>
                  <span className="rounded-full bg-aqua/20 px-3 py-1 text-xs text-aqua">{event.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{event.eventType.replaceAll("_", " ")}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Payout Queue" subtitle="Medium-risk and social-trigger claims stay in the review queue.">
          <div className="space-y-3">
            {adminDashboard.payoutQueue.map((claim) => (
              <div key={claim._id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{claim.decision}</p>
                  <span className="text-sm text-slate-300">Rs {claim.cappedPayout}</span>
                </div>
                <p className="mt-2 text-sm text-amber-300">Risk: {claim.fraudRiskTier}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Fraud Alerts" subtitle="Cluster fraud and spoofing indicators are grouped for triage.">
          <div className="space-y-3">
            {adminDashboard.fraudAlerts.map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-rose-300">{item.riskTier}</p>
                  <span className="text-sm text-slate-300">Score {item.score}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.explanation.join(", ")}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Appeals" subtitle="Held or rejected claims can be reviewed with rider-provided evidence.">
          <div className="space-y-3">
            {adminDashboard.appeals.map((appeal) => (
              <div key={appeal._id} className="rounded-2xl bg-slate-950/40 p-4">
                <p className="font-semibold">{appeal.status}</p>
                <p className="mt-2 text-sm text-slate-300">{appeal.reason}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

