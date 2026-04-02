import { RiderProfile } from "../models/RiderProfile.js";
import { Event } from "../models/Event.js";
import { Claim } from "../models/Claim.js";
import { Payout } from "../models/Payout.js";
import { Appeal } from "../models/Appeal.js";
import { calculatePremium } from "./premiumService.js";
import { ApiError } from "../utils/ApiError.js";

export async function getRiderDashboard(userId) {
  const rider = await RiderProfile.findOne({ userId }).populate("userId");
  if (!rider) {
    throw new ApiError(404, "Rider profile not found");
  }

  const [activeAlerts, recentClaims, recentPayouts] = await Promise.all([
    Event.find({ city: rider.city, status: { $in: ["APPROVED", "PROCESSING"] } }).sort({ detectedAt: -1 }).limit(5).lean(),
    Claim.find({ riderId: rider._id }).sort({ createdAt: -1 }).limit(5).populate("eventId").lean(),
    Payout.find({ riderId: rider._id }).sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const premium = calculatePremium({
    weeklyIncome: rider.weeklyEarningsAverage || 3500,
    zoneRiskScore: 0.8,
    planKey: rider.plan
  });

  return { rider, premium, activeAlerts, recentClaims, recentPayouts };
}

export async function updatePlan(userId, plan) {
  const rider = await RiderProfile.findOneAndUpdate({ userId }, { plan }, { new: true });
  if (!rider) {
    throw new ApiError(404, "Rider profile not found");
  }

  return {
    rider,
    premium: calculatePremium({
      weeklyIncome: rider.weeklyEarningsAverage || 3500,
      zoneRiskScore: 0.8,
      planKey: rider.plan
    })
  };
}

export async function getAlerts(userId) {
  const rider = await RiderProfile.findOne({ userId });
  if (!rider) {
    throw new ApiError(404, "Rider profile not found");
  }

  return Event.find({
    $or: [{ city: rider.city }, { zoneCode: rider.zoneCode }],
    status: { $in: ["APPROVED", "PROCESSING", "COMPLETED"] }
  }).sort({ detectedAt: -1 }).limit(20).lean();
}

export async function getPayoutHistory(userId) {
  const rider = await RiderProfile.findOne({ userId });
  if (!rider) {
    throw new ApiError(404, "Rider profile not found");
  }

  return Payout.find({ riderId: rider._id })
    .sort({ createdAt: -1 })
    .populate({ path: "claimId", populate: { path: "eventId" } })
    .lean();
}

export async function createAppeal(userId, payload) {
  const rider = await RiderProfile.findOne({ userId });
  if (!rider) {
    throw new ApiError(404, "Rider profile not found");
  }

  const claim = await Claim.findOne({ _id: payload.claimId, riderId: rider._id });
  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  claim.appealed = true;
  await claim.save();

  return Appeal.create({
    claimId: claim._id,
    riderId: rider._id,
    reason: payload.reason,
    attachments: payload.attachments || []
  });
}

