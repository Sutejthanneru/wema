import axios from "axios";
import { env } from "../config/env.js";
import { FraudLog } from "../models/FraudLog.js";

export async function scoreFraud({ rider, event, historicalRisk, clusterContext }) {
  const payload = {
    rider_id: rider._id.toString(),
    event_id: event._id.toString(),
    event_type: event.eventType,
    source_type: event.sourceType,
    device_fingerprint: rider.deviceFingerprint,
    current_gps: rider.currentGps,
    delivery_route: rider.activeDelivery?.routePolyline || [],
    route_history: rider.routeHistory || [],
    accelerometer_score: rider.motionTelemetry?.accelerometerScore || 0,
    gyroscope_score: rider.motionTelemetry?.gyroscopeScore || 0,
    average_speed_kph: rider.motionTelemetry?.averageSpeedKph || 0,
    ip_address: rider.ipAddress,
    network_type: rider.networkType,
    accepted_at: rider.activeDelivery?.acceptedAt,
    pickup_at: rider.activeDelivery?.pickupAt,
    event_detected_at: event.detectedAt,
    historical_claim_rate: rider.historicalClaimRate || 0,
    historical_fraud_flags: rider.historicalFraudFlags || 0,
    cluster_context: clusterContext,
    weather_cross_verification: historicalRisk.weatherCrossVerification
  };

  let result;

  try {
    const response = await axios.post(`${env.fraudServiceUrl}/score`, payload, { timeout: 5000 });
    result = response.data;
  } catch (_error) {
    const fallbackScore = Math.min(
      0.99,
      0.1 +
        (rider.historicalFraudFlags || 0) * 0.12 +
        (clusterContext.sharedDeviceCount > 1 ? 0.2 : 0) +
        (clusterContext.sharedIpCount > 2 ? 0.2 : 0)
    );

    result = {
      score: fallbackScore,
      risk_tier: fallbackScore > 0.8 ? "HIGH" : fallbackScore > 0.55 ? "MEDIUM" : "LOW",
      explanations: ["Fallback risk model used because fraud service was unavailable"]
    };
  }

  return {
    score: result.score,
    riskTier: result.risk_tier,
    explanations: result.explanations || [],
    requiresAdditionalVerification: Boolean(result.requires_additional_verification)
  };
}

export async function logFraudAssessment({ riderId, eventId, claimId, signals, clusterContext, score, riskTier, explanation }) {
  return FraudLog.create({
    riderId,
    eventId,
    claimId,
    signals,
    clusterContext,
    score,
    riskTier,
    explanation
  });
}
