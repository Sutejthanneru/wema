import axios from "axios";
import { Event } from "../models/Event.js";
import { RiderProfile } from "../models/RiderProfile.js";
import { EVENT_SOURCES, EVENT_STATUS } from "../constants/eventTypes.js";
import { evaluateRiderForEvent } from "./eligibilityService.js";
import { releasePayoutForClaim } from "./payoutService.js";
import { env } from "../config/env.js";

function buildSeverity(eventType, snapshot) {
  if (eventType === "CYCLONE") return { label: "SEVERE", factor: 1.5 };
  if (eventType === "FLOOD") return { label: "HIGH", factor: 1.3 };
  if (eventType === "EARTHQUAKE") return { label: "HIGH", factor: snapshot.magnitude >= 6 ? 1.5 : 1.25 };
  if (eventType === "EXTREME_HEAT") return { label: "MODERATE", factor: 1.15 };
  if (eventType === "SEVERE_POLLUTION") return { label: "MODERATE", factor: 1.1 };
  return { label: "MODERATE", factor: 1.0 };
}

export async function ingestWeatherEvent(payload) {
  return Event.create({
    sourceType: EVENT_SOURCES.WEATHER,
    eventType: payload.eventType,
    city: payload.city,
    zoneCode: payload.zoneCode,
    center: payload.center,
    radiusKm: payload.radiusKm,
    affectedPolygon: payload.affectedPolygon || [],
    severity: buildSeverity(payload.eventType, payload.thresholdSnapshot || {}),
    thresholdSnapshot: payload.thresholdSnapshot || {},
    status: EVENT_STATUS.APPROVED,
    triggerSource: payload.triggerSource || "OpenWeather",
    detectedAt: payload.detectedAt || new Date(),
    lossWindowStart: payload.lossWindowStart,
    lossWindowEnd: payload.lossWindowEnd,
    metadata: payload.metadata || {}
  });
}

export async function ingestSocialEvent(payload) {
  return Event.create({
    sourceType: EVENT_SOURCES.SOCIAL,
    eventType: payload.eventType,
    city: payload.city,
    zoneCode: payload.zoneCode,
    center: payload.center,
    radiusKm: payload.radiusKm,
    affectedPolygon: payload.affectedPolygon || [],
    severity: payload.severity || { label: "SOCIAL", factor: 1.0 },
    thresholdSnapshot: payload.thresholdSnapshot || {},
    status: EVENT_STATUS.PENDING_ADMIN_APPROVAL,
    triggerSource: payload.triggerSource || "NewsAPI + Order Analytics",
    detectedAt: payload.detectedAt || new Date(),
    lossWindowStart: payload.lossWindowStart,
    lossWindowEnd: payload.lossWindowEnd,
    metadata: payload.metadata || {}
  });
}

export async function processApprovedEvent(eventId) {
  const event = await Event.findByIdAndUpdate(eventId, { status: EVENT_STATUS.PROCESSING }, { new: true });
  const riders = await RiderProfile.find({ city: event.city, zoneCode: event.zoneCode });
  const results = [];

  for (const rider of riders) {
    const claim = await evaluateRiderForEvent(rider, event);
    let payout = null;

    if (claim.decision === "APPROVED") {
      payout = await releasePayoutForClaim(claim._id);
    }

    results.push({
      riderId: rider._id,
      claimId: claim._id,
      decision: claim.decision,
      payoutId: payout?._id || null
    });
  }

  event.status = EVENT_STATUS.COMPLETED;
  await event.save();

  return { event, results };
}

export async function runWeatherSyncStub() {
  const syntheticEvents = [
    {
      eventType: "HEAVY_RAIN",
      city: "Hyderabad",
      zoneCode: "HYD-KUKATPALLY",
      center: { lat: 17.4948, lng: 78.3996 },
      radiusKm: 6,
      affectedPolygon: [
        { lat: 17.49, lng: 78.39 },
        { lat: 17.5, lng: 78.41 }
      ],
      thresholdSnapshot: { alertLevel: "MODERATE" },
      lossWindowStart: new Date(),
      lossWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }
  ];

  const created = [];
  for (const item of syntheticEvents) {
    created.push(await ingestWeatherEvent(item));
  }
  return created;
}

export async function fetchExternalSignalsSummary() {
  const summary = {
    weatherProvider: "OpenWeather",
    newsProvider: "NewsAPI",
    configured: Boolean(env.openWeatherApiKey && env.newsApiKey)
  };

  if (!summary.configured) {
    return summary;
  }

  try {
    await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { q: "Hyderabad,IN", appid: env.openWeatherApiKey },
      timeout: 3000
    });
    summary.weatherReachable = true;
  } catch (_error) {
    summary.weatherReachable = false;
  }

  return summary;
}

