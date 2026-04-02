import { Claim } from "../models/Claim.js";
import { Payout } from "../models/Payout.js";
import { RiderProfile } from "../models/RiderProfile.js";

function mockRazorpayTransfer({ amount, upiId }) {
  return {
    providerReference: `rzp_${Date.now()}`,
    amount,
    upiId,
    status: "PAID"
  };
}

export async function releasePayoutForClaim(claimId) {
  const claim = await Claim.findById(claimId).populate("riderId");
  if (!claim || claim.decision !== "APPROVED") {
    return null;
  }

  const rider = await RiderProfile.findById(claim.riderId._id);
  const transfer = mockRazorpayTransfer({
    amount: claim.cappedPayout,
    upiId: rider.upiId
  });

  const payout = await Payout.create({
    claimId: claim._id,
    riderId: rider._id,
    amount: claim.cappedPayout,
    providerReference: transfer.providerReference,
    status: transfer.status,
    paidAt: new Date()
  });

  claim.decision = "PAID";
  await claim.save();

  return payout;
}

