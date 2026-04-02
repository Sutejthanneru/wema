import { PLAN_CONFIG } from "../constants/plans.js";
import { getCurrentSeason } from "../utils/time.js";
import { ApiError } from "../utils/ApiError.js";

const seasonalMultiplier = {
  SUMMER: 1.08,
  MONSOON: 1.2,
  WINTER: 1.0
};

export function calculatePremium({ weeklyIncome, zoneRiskScore, planKey, date = new Date() }) {
  const plan = PLAN_CONFIG[planKey];
  if (!plan) {
    throw new ApiError(400, "Invalid plan selected");
  }

  const season = getCurrentSeason(date);
  const riskMultiplier = 1 + Math.min(Math.max(zoneRiskScore, 0), 1.5);
  const seasonMultiplier = seasonalMultiplier[season] || 1;
  const rawPremium = plan.weeklyPremiumBase * riskMultiplier * seasonMultiplier;
  const premiumCap = weeklyIncome * 0.02;

  return {
    season,
    rawPremium: Number(rawPremium.toFixed(2)),
    recommendedPremium: Number(Math.min(rawPremium, premiumCap).toFixed(2)),
    premiumCap: Number(premiumCap.toFixed(2))
  };
}

