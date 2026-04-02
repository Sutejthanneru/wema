import { asyncHandler } from "../utils/asyncHandler.js";
import { decideSocialTrigger, getAdminDashboard, reviewClaim } from "../services/adminService.js";

export const dashboard = asyncHandler(async (_req, res) => {
  const result = await getAdminDashboard();
  res.json({ success: true, data: result });
});

export const decideTrigger = asyncHandler(async (req, res) => {
  const result = await decideSocialTrigger(
    req.params.eventId,
    req.auth.userId,
    req.body.approved,
    req.body.note
  );
  res.json({ success: true, data: result });
});

export const reviewClaimDecision = asyncHandler(async (req, res) => {
  const result = await reviewClaim(req.params.claimId, req.body.approved, req.body.note);
  res.json({ success: true, data: result });
});

