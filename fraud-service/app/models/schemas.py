from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class LocationPoint(BaseModel):
    lat: float
    lng: float


class ClusterContext(BaseModel):
    sharedIpCount: int = 0
    sharedDeviceCount: int = 0
    suspiciousZoneBurst: bool = False


class FraudScoreRequest(BaseModel):
    rider_id: str
    event_id: str
    event_type: str
    source_type: str
    device_fingerprint: str
    current_gps: LocationPoint
    delivery_route: List[LocationPoint] = []
    route_history: List[LocationPoint] = []
    accelerometer_score: float = 0.0
    gyroscope_score: float = 0.0
    average_speed_kph: float = 0.0
    ip_address: Optional[str] = None
    network_type: Optional[str] = None
    accepted_at: Optional[datetime] = None
    pickup_at: Optional[datetime] = None
    event_detected_at: datetime
    historical_claim_rate: float = 0.0
    historical_fraud_flags: int = 0
    cluster_context: ClusterContext
    weather_cross_verification: bool = True


class FraudScoreResponse(BaseModel):
    score: float
    risk_tier: str
    explanations: List[str]
    requires_additional_verification: bool

