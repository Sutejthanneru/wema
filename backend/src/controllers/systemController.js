import { asyncHandler } from "../utils/asyncHandler.js";
import {
  fetchExternalSignalsSummary,
  ingestSocialEvent,
  processApprovedEvent,
  runWeatherSyncStub
} from "../services/eventDetectionService.js";

export const weatherSync = asyncHandler(async (_req, res) => {
  const events = await runWeatherSyncStub();
  res.status(201).json({ success: true, data: events });
});

export const socialDetection = asyncHandler(async (req, res) => {
  const event = await ingestSocialEvent(req.body);
  res.status(201).json({ success: true, data: event });
});

export const processEvent = asyncHandler(async (req, res) => {
  const result = await processApprovedEvent(req.params.eventId);
  res.json({ success: true, data: result });
});

export const signalHealth = asyncHandler(async (_req, res) => {
  const result = await fetchExternalSignalsSummary();
  res.json({ success: true, data: result });
});

