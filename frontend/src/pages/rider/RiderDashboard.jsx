import { useEffect, useState } from "react";
import { Panel } from "../../components/ui/Panel.jsx";
import api from "../../api/client.js";

export default function RiderDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [appealForm, setAppealForm] = useState({ claimId: "", reason: "" });
  const [appealMessage, setAppealMessage] = useState("");
  const [complaintForm, setComplaintForm] = useState({
    category: "PAYMENT_DELAY",
    subject: "",
    message: ""
  });
  const [complaintMessage, setComplaintMessage] = useState("");
  const [providerSyncForm, setProviderSyncForm] = useState({
    deliveryStatus: "IDLE"
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    city: "",
    zoneCode: "",
    upiId: "",
    provider: "",
    weeklyEarningsAverage: ""
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [pinLocationLoading, setPinLocationLoading] = useState(false);
  const [watchingLocation, setWatchingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const loadRiderData = async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data: dashboardResponse }, { data: payoutsResponse }, { data: plansResponse }] = await Promise.all([
        api.get("/rider/dashboard"),
        api.get("/rider/payouts"),
        api.get("/rider/plans")
      ]);

      setDashboard(dashboardResponse.data);
      setPayouts(payoutsResponse.data);
      setPlans(plansResponse.data);
      if (dashboardResponse.data?.rider) {
        const rider = dashboardResponse.data.rider;
        setProfileForm({
          name: rider.userId?.name || rider.name || "",
          phone: rider.userId?.phone || rider.phone || "",
          city: rider.city || "",
          zoneCode: rider.zoneCode || "",
          upiId: rider.upiId || "",
          provider: rider.provider || "",
          weeklyEarningsAverage: rider.weeklyEarningsAverage ?? ""
        });
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load rider dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiderData();
  }, []);

  const handlePlanChange = async (plan) => {
    setSavingPlan(plan);
    setError("");

    try {
      const { data } = await api.post("/rider/plan", { plan });
      setDashboard((current) => ({
        ...current,
        rider: data.data.rider,
        premium: data.data.premium
      }));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update plan.");
    } finally {
      setSavingPlan("");
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    setError("");
    setAppealMessage("");
    setComplaintMessage("");

    try {
      await api.post("/rider/subscribe", {
        plan: currentPlan,
        autoRenew: false
      });
      await loadRiderData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to activate policy.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleProviderSync = async (event) => {
    event.preventDefault();
    setError("");
    setAppealMessage("");
    setComplaintMessage("");
    setLocationMessage("");

    try {
      await api.post("/rider/provider-sync", providerSyncForm);
      await loadRiderData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to sync provider status.");
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError("");
    setProfileMessage("");
    setSavingProfile(true);
    try {
      const { data } = await api.patch("/rider/profile", {
        ...profileForm,
        weeklyEarningsAverage: profileForm.weeklyEarningsAverage === "" ? undefined : Number(profileForm.weeklyEarningsAverage)
      });
      const updatedRider = data?.data?.rider;
      if (updatedRider) {
        setDashboard((current) => ({
          ...current,
          rider: updatedRider
        }));
        setProfileForm({
          name: updatedRider.userId?.name || updatedRider.name || "",
          phone: updatedRider.userId?.phone || updatedRider.phone || "",
          city: updatedRider.city || "",
          zoneCode: updatedRider.zoneCode || "",
          upiId: updatedRider.upiId || "",
          provider: updatedRider.provider || "",
          weeklyEarningsAverage: updatedRider.weeklyEarningsAverage ?? ""
        });
      }
      setProfileMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAppealSubmit = async (event) => {
    event.preventDefault();
    setAppealMessage("");
    setComplaintMessage("");
    setError("");

    try {
      await api.post("/rider/appeals", appealForm);
      setAppealMessage("Appeal submitted for manual review.");
      setAppealForm({ claimId: "", reason: "" });
      await loadRiderData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit appeal.");
    }
  };

  const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    setComplaintMessage("");
    setAppealMessage("");
    setError("");

    try {
      await api.post("/rider/complaints", complaintForm);
      setComplaintMessage("Complaint submitted successfully.");
      setComplaintForm({
        category: "PAYMENT_DELAY",
        subject: "",
        message: ""
      });
      await loadRiderData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to submit complaint.");
    }
  };

  const pushCurrentLocation = async (position) => {
    await api.post("/rider/location", {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
    await loadRiderData();
  };

  const handleUseMyLocation = () => {
    setError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await pushCurrentLocation(position);
          setLocationMessage("Current GPS updated from this device.");
        } catch (requestError) {
          setError(requestError?.response?.data?.message || "Unable to update current GPS.");
        } finally {
          setLocationLoading(false);
        }
      },
      (geoError) => {
        setError(geoError.message || "Unable to access device location.");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const toggleLiveLocation = () => {
    setError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    if (watchingLocation && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchingLocation(false);
      setWatchId(null);
      setLocationMessage("Live GPS tracking stopped.");
      return;
    }

    const nextWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await pushCurrentLocation(position);
          setLocationMessage("Live GPS tracking is active.");
        } catch (requestError) {
          setError(requestError?.response?.data?.message || "Unable to sync live GPS.");
        }
      },
      (geoError) => {
        setError(geoError.message || "Unable to start live GPS tracking.");
        setWatchingLocation(false);
        setWatchId(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(nextWatchId);
    setWatchingLocation(true);
  };

  const handleUsePinLocation = async () => {
    setError("");
    setLocationMessage("");
    setPinLocationLoading(true);
    try {
      await api.post("/rider/pin-location");
      setLocationMessage("GPS updated to PIN location for eligibility checks.");
      await loadRiderData();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to use PIN location.");
    } finally {
      setPinLocationLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (loading) {
    return (
      <div className="glass rounded-[2rem] p-10 text-center text-slate-300 shadow-panel">
        Loading rider dashboard...
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="glass rounded-[2rem] p-10 text-center text-rose-300 shadow-panel">
        {error}
      </div>
    );
  }

  const currentPlan = dashboard?.rider?.plan;
  const claims = dashboard?.recentClaims || [];
  const activeAlerts = dashboard?.activeAlerts || [];
  const appeals = dashboard?.appeals || [];
  const complaints = dashboard?.complaints || [];
  const eligibilityStatus = dashboard?.eligibilityStatus || {};
  const appealableClaims = claims.filter((claim) =>
    ["REJECTED", "HOLD_RIDER_VERIFICATION"].includes(claim.decision)
  );
  const activePolicy = dashboard?.activePolicy;
  const premiumPayments = dashboard?.premiumPayments || [];
  const activeDeliveryStatus = dashboard?.rider?.activeDelivery?.status || "IDLE";
  const currentGps = dashboard?.rider?.currentGps;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Panel title="Protected This Week" subtitle="Premium stays capped at 2% of expected weekly earnings.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Current Plan</p>
              <p className="mt-2 text-2xl font-semibold">{currentPlan}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">This Week's Premium</p>
              <p className="mt-2 text-2xl font-semibold">Rs {dashboard?.premium?.recommendedPremium ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Weekly Income Avg</p>
              <p className="mt-2 text-2xl font-semibold">Rs {dashboard?.rider?.weeklyEarningsAverage ?? 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950/40 p-4">
            <div>
              <p className="text-sm text-slate-400">Policy status</p>
              <p className="mt-1 font-semibold text-white">{activePolicy ? activePolicy.status : "INACTIVE"}</p>
            </div>
            <button
              className="rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? "Activating..." : activePolicy ? "Renew policy" : "Activate policy"}
            </button>
          </div>
        </Panel>

        <Panel title="Coverage Status" subtitle="Coverage is system-driven and based on the rider's active plan and event match.">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Covered Today</p>
              <p className="mt-2 text-xl font-semibold">{eligibilityStatus.coveredToday ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Latest Claim</p>
              <p className="mt-2 text-xl font-semibold">{eligibilityStatus.latestClaimDecision || "NO_EVENT"}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Open Appeals</p>
              <p className="mt-2 text-xl font-semibold">{eligibilityStatus.openAppeals ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Open Complaints</p>
              <p className="mt-2 text-xl font-semibold">{eligibilityStatus.openComplaints ?? 0}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Current GPS</p>
            <p className="mt-1 font-semibold text-white">
              {currentGps ? `${currentGps.lat.toFixed(5)}, ${currentGps.lng.toFixed(5)}` : "No GPS stored"}
            </p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <button
                className="rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Fetching GPS..." : "Use my location"}
              </button>
              <button
                className="rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white disabled:opacity-60"
                type="button"
                onClick={handleUsePinLocation}
                disabled={pinLocationLoading}
              >
                {pinLocationLoading ? "Setting PIN GPS..." : "Use PIN location"}
              </button>
              <button
                className="rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white"
                type="button"
                onClick={toggleLiveLocation}
              >
                {watchingLocation ? "Stop live GPS" : "Start live GPS"}
              </button>
            </div>
            {locationMessage ? <p className="mt-3 text-sm text-emerald-300">{locationMessage}</p> : null}
          </div>
        </Panel>

        <Panel title="Provider Sync" subtitle="Demo-mode provider snapshot for active delivery verification.">
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleProviderSync}>
            <select
              className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              value={providerSyncForm.deliveryStatus}
              onChange={(event) => setProviderSyncForm({ deliveryStatus: event.target.value })}
            >
              <option value="IDLE">IDLE</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PICKED_UP">PICKED_UP</option>
            </select>
            <button className="rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950" type="submit">
              Sync provider status
            </button>
          </form>
          <p className="mt-3 text-sm text-slate-400">Current synced delivery status: {activeDeliveryStatus}</p>
        </Panel>

        <Panel title="Live Alerts" subtitle="Alerts are system-detected. Riders do not submit claims manually.">
          <div className="space-y-3">
            {activeAlerts.length ? activeAlerts.map((alert) => (
              <div key={alert._id} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{alert.eventType.replaceAll("_", " ")}</p>
                  <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-300">
                    {alert.severity.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{alert.city}</p>
              </div>
            )) : <div className="rounded-2xl bg-slate-900/50 p-4 text-sm text-slate-400">No verified alerts for this rider right now.</div>}
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
                {claims.length ? claims.map((claim) => (
                  <tr key={claim._id}>
                    <td className="px-4 py-3">{claim.eventId.eventType.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">{claim.decision}</td>
                    <td className="px-4 py-3">Rs {claim.cappedPayout}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-400" colSpan="3">
                      No claims generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Payout History" subtitle="Only paid or processed payouts appear once the backend releases them.">
          <div className="space-y-3">
            {payouts.length ? payouts.map((payout) => (
              <div key={payout._id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{payout.claimId?.eventId?.eventType?.replaceAll("_", " ") || "Claim payout"}</p>
                  <span className="text-sm text-slate-300">Rs {payout.amount}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{payout.status}</p>
              </div>
            )) : <div className="rounded-2xl bg-slate-900/50 p-4 text-sm text-slate-400">No payouts yet.</div>}
          </div>
        </Panel>

        <Panel title="Premium Payments" subtitle="Weekly premium subscriptions and renewals are recorded here.">
          <div className="space-y-3">
            {premiumPayments.length ? premiumPayments.map((payment) => (
              <div key={payment._id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{payment.method}</p>
                  <span className="text-sm text-slate-300">Rs {payment.amount}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{payment.status}</p>
              </div>
            )) : <div className="rounded-2xl bg-slate-900/50 p-4 text-sm text-slate-400">No premium payments yet.</div>}
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Edit Profile" subtitle="Update city, zone, UPI, and contact details.">
          <form className="space-y-3" onSubmit={handleProfileSave}>
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Full name"
              value={profileForm.name}
              onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Phone number"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="City (e.g., Kavali)"
              value={profileForm.city}
              onChange={(event) => setProfileForm((current) => ({ ...current, city: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="PIN code (6 digits, e.g., 524201)"
              value={profileForm.zoneCode}
              onChange={(event) => setProfileForm((current) => ({ ...current, zoneCode: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="UPI ID"
              value={profileForm.upiId}
              onChange={(event) => setProfileForm((current) => ({ ...current, upiId: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Provider (Zomato/Swiggy)"
              value={profileForm.provider}
              onChange={(event) => setProfileForm((current) => ({ ...current, provider: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Weekly earnings average"
              value={profileForm.weeklyEarningsAverage}
              onChange={(event) => setProfileForm((current) => ({ ...current, weeklyEarningsAverage: event.target.value }))}
            />
            {profileMessage ? <p className="text-sm text-emerald-300">{profileMessage}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              className="w-full rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
        </Panel>

        <Panel title="Plan Selection" subtitle="Coverage expands by calamity type, payout speed, and weekly cap.">
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.key}
                type="button"
                onClick={() => handlePlanChange(plan.key)}
                disabled={savingPlan === plan.key || currentPlan === plan.key}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  plan.key === currentPlan ? "border-aqua bg-aqua/10" : "border-slate-800 bg-slate-950/40"
                }`}
                >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{plan.key}</p>
                  <span className="text-sm text-slate-300">
                    {savingPlan === plan.key ? "Updating..." : `Rs ${plan.weeklyPremiumBase}/week`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Weekly max payout: Rs {plan.weeklyPayoutCap}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Covers: {plan.calamityTypes.map((type) => type.replaceAll("_", " ")).join(", ")}
                </p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Appeal Path" subtitle="High-risk holds request extra evidence instead of instant rejection.">
          <form className="space-y-3" onSubmit={handleAppealSubmit}>
            <select
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              value={appealForm.claimId}
              onChange={(event) => setAppealForm((current) => ({ ...current, claimId: event.target.value }))}
              required
              disabled={!appealableClaims.length}
            >
              <option value="">
                {appealableClaims.length ? "Choose a claim to appeal" : "No appeal-eligible claims yet"}
              </option>
              {appealableClaims.map((claim) => (
                <option key={claim._id} value={claim._id}>
                  {claim.eventId.eventType.replaceAll("_", " ")} - {claim.decision}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Why should this claim be reviewed again?"
              value={appealForm.reason}
              onChange={(event) => setAppealForm((current) => ({ ...current, reason: event.target.value }))}
              required
              disabled={!appealableClaims.length}
            />
            {!appealableClaims.length ? (
              <p className="text-sm text-slate-400">
                Appeals only appear after a claim is marked as `REJECTED` or `HOLD_RIDER_VERIFICATION`.
              </p>
            ) : null}
            {appealMessage ? <p className="text-sm text-emerald-300">{appealMessage}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              className="w-full rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={!appealableClaims.length}
            >
              Submit appeal
            </button>
          </form>
        </Panel>

        <Panel title="Complaints" subtitle="Riders can raise service complaints like delays or wrong calculations.">
          <form className="space-y-3" onSubmit={handleComplaintSubmit}>
            <select
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              value={complaintForm.category}
              onChange={(event) => setComplaintForm((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="PAYMENT_DELAY">Payment delay</option>
              <option value="WRONG_CALCULATION">Wrong calculation</option>
              <option value="TECHNICAL_ISSUE">Technical issue</option>
              <option value="OTHER">Other</option>
            </select>
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Complaint subject"
              value={complaintForm.subject}
              onChange={(event) => setComplaintForm((current) => ({ ...current, subject: event.target.value }))}
              required
            />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-white outline-none"
              placeholder="Describe the issue"
              value={complaintForm.message}
              onChange={(event) => setComplaintForm((current) => ({ ...current, message: event.target.value }))}
              required
            />
            {complaintMessage ? <p className="text-sm text-emerald-300">{complaintMessage}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button className="w-full rounded-2xl bg-aqua px-4 py-3 font-semibold text-slate-950" type="submit">
              Submit complaint
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {complaints.length ? complaints.map((complaint) => (
              <div key={complaint._id} className="rounded-2xl bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{complaint.subject}</p>
                  <span className="text-sm text-slate-300">{complaint.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{complaint.category.replaceAll("_", " ")}</p>
              </div>
            )) : <div className="rounded-2xl bg-slate-900/50 p-4 text-sm text-slate-400">No complaints raised yet.</div>}
          </div>
        </Panel>

        <Panel title="Appeal Tracking" subtitle="Open and resolved appeals are visible to the rider.">
          <div className="space-y-3">
            {appeals.length ? appeals.map((appeal) => (
              <div key={appeal._id} className="rounded-2xl bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{appeal.claimId?._id ? `Claim ${appeal.claimId._id}` : "Appeal"}</p>
                  <span className="text-sm text-slate-300">{appeal.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{appeal.reason}</p>
              </div>
            )) : <div className="rounded-2xl bg-slate-900/50 p-4 text-sm text-slate-400">No appeals filed yet.</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
