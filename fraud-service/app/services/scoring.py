import math
import os
from datetime import datetime

import numpy as np
from sklearn.ensemble import IsolationForest


def _minutes_between(start: datetime | None, end: datetime | None) -> float:
    if not start or not end:
        return 999.0
    return abs((end - start).total_seconds()) / 60.0


class FraudScoringService:
    def __init__(self) -> None:
        contamination = float(os.getenv("FRAUD_CONTAMINATION", "0.1"))
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=120
        )
        self.model.fit(self._training_matrix())

    def _training_matrix(self) -> np.ndarray:
        legitimate = np.array(
            [
                [0.72, 0.70, 23, 18, 0.08, 0, 0, 0, 1],
                [0.64, 0.60, 27, 24, 0.12, 0, 0, 0, 1],
                [0.81, 0.78, 19, 11, 0.05, 0, 0, 0, 1],
                [0.69, 0.68, 21, 14, 0.09, 0, 0, 0, 1]
            ]
        )
        suspicious = np.array(
            [
                [0.01, 0.02, 0, 1, 0.85, 1, 3, 2, 0],
                [0.15, 0.12, 4, 2, 0.70, 1, 4, 1, 0],
                [0.08, 0.05, 0, 0.5, 0.92, 1, 5, 4, 0]
            ]
        )
        return np.vstack([legitimate, suspicious])

    def build_features(self, payload) -> np.ndarray:
        accept_delta = _minutes_between(payload.accepted_at, payload.event_detected_at)
        movement_consistency = min(max((payload.accelerometer_score + payload.gyroscope_score) / 2, 0), 1)
        speed_score = min(payload.average_speed_kph, 60)
        cluster_ip = payload.cluster_context.sharedIpCount
        cluster_device = payload.cluster_context.sharedDeviceCount
        burst = 1 if payload.cluster_context.suspiciousZoneBurst else 0
        route_depth = len(payload.route_history) / 50
        weather_cross = 1 if payload.weather_cross_verification else 0

        return np.array(
            [
                movement_consistency,
                payload.gyroscope_score,
                speed_score,
                accept_delta,
                payload.historical_claim_rate,
                payload.historical_fraud_flags,
                cluster_ip,
                cluster_device + burst,
                weather_cross + route_depth
            ]
        ).reshape(1, -1)

    def score(self, payload):
        features = self.build_features(payload)
        raw_score = self.model.decision_function(features)[0]
        normalized = 1 / (1 + math.exp(raw_score * 5))

        explanations = []
        if payload.average_speed_kph < 5:
            explanations.append("Unrealistically low movement for an active delivery")
        if payload.cluster_context.sharedIpCount > 2:
            explanations.append("Multiple claims from the same IP subnet")
        if payload.cluster_context.sharedDeviceCount > 1:
            explanations.append("Device fingerprint appears across multiple claims")
        if _minutes_between(payload.accepted_at, payload.event_detected_at) < 5:
            explanations.append("Order accepted suspiciously close to the alert time")
        if payload.historical_fraud_flags >= 2:
            explanations.append("Repeat anomalous behavior seen across prior events")
        if not payload.weather_cross_verification:
            explanations.append("Cross-rider or sensor verification was weak for this event")

        if payload.historical_fraud_flags >= 3 and normalized > 0.75:
            risk_tier = "REPEAT_HIGH"
        elif normalized > 0.8:
            risk_tier = "HIGH"
        elif normalized > 0.55:
            risk_tier = "MEDIUM"
        else:
            risk_tier = "LOW"

        if not explanations:
            explanations.append("Telemetry and route behavior look consistent with a real rider")

        return {
            "score": round(float(normalized), 4),
            "risk_tier": risk_tier,
            "explanations": explanations,
            "requires_additional_verification": risk_tier in {"HIGH", "REPEAT_HIGH"}
        }

