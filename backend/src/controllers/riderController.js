import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAppeal,
  getAlerts,
  getPayoutHistory,
  getRiderDashboard,
  updatePlan
} from "../services/riderService.js";

export const dashboard = asyncHandler(async (req, res) => {
  const result = await getRiderDashboard(req.auth.userId);
  res.json({ success: true, data: result });
});

export const selectPlan = asyncHandler(async (req, res) => {
  const result = await updatePlan(req.auth.userId, req.body.plan);
  res.json({ success: true, data: result });
});

export const alerts = asyncHandler(async (req, res) => {
  const result = await getAlerts(req.auth.userId);
  res.json({ success: true, data: result });
});

export const payouts = asyncHandler(async (req, res) => {
  const result = await getPayoutHistory(req.auth.userId);
  res.json({ success: true, data: result });
});

export const appeal = asyncHandler(async (req, res) => {
  const result = await createAppeal(req.auth.userId, req.body);
  res.status(201).json({ success: true, data: result });
});

