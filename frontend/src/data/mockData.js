export const riderDashboard = {
  rider: {
    provider: "ZOMATO",
    city: "Hyderabad",
    zoneCode: "HYD-KUKATPALLY",
    plan: "PRO",
    weeklyEarningsAverage: 3500
  },
  premium: {
    recommendedPremium: 70,
    premiumCap: 70,
    season: "SUMMER"
  },
  activeAlerts: [
    {
      _id: "evt_1",
      eventType: "HEAVY_RAIN",
      city: "Hyderabad",
      severity: { label: "MODERATE", factor: 1.0 }
    }
  ],
  recentClaims: [
    {
      _id: "clm_1",
      decision: "PAID",
      cappedPayout: 220,
      eventId: { eventType: "HEAVY_RAIN", city: "Hyderabad" }
    },
    {
      _id: "clm_2",
      decision: "ADMIN_REVIEW",
      cappedPayout: 310,
      eventId: { eventType: "BANDH", city: "Mumbai" }
    }
  ]
};

export const adminDashboard = {
  metrics: {
    ridersRegistered: 4210,
    activeEventCount: 3,
    pendingPayoutActions: 18,
    flaggedFraudCases: 7,
    totalPaid: 186540
  },
  activeEvents: [
    { _id: "evt_1", eventType: "HEAVY_RAIN", city: "Hyderabad", status: "PROCESSING" },
    { _id: "evt_2", eventType: "BANDH", city: "Mumbai", status: "PENDING_ADMIN_APPROVAL" }
  ],
  payoutQueue: [
    { _id: "clm_10", decision: "ADMIN_REVIEW", fraudRiskTier: "MEDIUM", cappedPayout: 330 },
    { _id: "clm_11", decision: "HOLD_RIDER_VERIFICATION", fraudRiskTier: "HIGH", cappedPayout: 410 }
  ],
  fraudAlerts: [
    { _id: "frd_1", riskTier: "HIGH", score: 0.87, explanation: ["Cluster burst from shared subnet", "Static motion telemetry"] }
  ],
  appeals: [{ _id: "apl_1", status: "OPEN", reason: "GPS drifted during rain under flyover" }]
};

