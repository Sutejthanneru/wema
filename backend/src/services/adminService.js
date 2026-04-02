import { Event } from "../models/Event.js";
import { Claim } from "../models/Claim.js";
import { Payout } from "../models/Payout.js";
import { FraudLog } from "../models/FraudLog.js";
import { Appeal } from "../models/Appeal.js";
import { RiderProfile } from "../models/RiderProfile.js";
import { processApprovedEvent } from "./eventDetectionService.js";
import { releasePayoutForClaim } from "./payoutService.js";
import { ApiError } from "../utils/ApiError.js";

export async function getAdminDashboard() {
  const [riderCount, activeEvents, payoutQueue, fraudAlerts, appeals, zoneBreakdown] = await Promise.all([
    RiderProfile.countDocuments(),
    Event.find({ status: { $in: ["APPROVED", "PROCESSING", "PENDING_ADMIN_APPROVAL"] } }).lean(),
    Claim.find({ decision: { $in: ["ADMIN_REVIEW", "HOLD_RIDER_VERIFICATION", "APPROVED"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("eventId riderId")
      .lean(),
    FraudLog.find({ riskTier: { $in: ["MEDIUM", "HIGH", "REPEAT_HIGH"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("riderId eventId")
      .lean(),
    Appeal.find({ status: { $in: ["OPEN", "UNDER_REVIEW"] } }).limit(20).populate("claimId").lean(),
    RiderProfile.aggregate([{ $group: { _id: "$zoneCode", count: { $sum: 1 } } }])
  ]);

  const totalPaid = await Payout.aggregate([{ $match: { status: "PAID" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);

  return {
    metrics: {
      ridersRegistered: riderCount,
      activeEventCount: activeEvents.length,
      pendingPayoutActions: payoutQueue.length,
      flaggedFraudCases: fraudAlerts.length,
      totalPaid: totalPaid[0]?.total || 0
    },
    activeEvents,
    payoutQueue,
    fraudAlerts,
    appeals,
    zoneBreakdown
  };
}

export async function decideSocialTrigger(eventId, adminId, approved, note) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  event.status = approved ? "APPROVED" : "REJECTED";
  event.adminDecision = { decidedBy: adminId, note, decidedAt: new Date() };
  await event.save();

  if (approved) {
    return processApprovedEvent(eventId);
  }

  return { event };
}

export async function reviewClaim(claimId, approved, note) {
  const claim = await Claim.findById(claimId);
  if (!claim) {
    throw new ApiError(404, "Claim not found");
  }

  claim.adminReviewNote = note;
  claim.decision = approved ? "APPROVED" : "REJECTED";
  await claim.save();

  let payout = null;
  if (approved) {
    payout = await releasePayoutForClaim(claim._id);
  }

  return { claim, payout };
}
