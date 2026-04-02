from fastapi import FastAPI

from app.models.schemas import FraudScoreRequest, FraudScoreResponse
from app.services.scoring import FraudScoringService

app = FastAPI(title="WEMA Fraud Service", version="1.0.0")
service = FraudScoringService()


@app.get("/health")
def health():
    return {"success": True, "service": "wema-fraud-service"}


@app.post("/score", response_model=FraudScoreResponse)
def score(payload: FraudScoreRequest):
    result = service.score(payload)
    return FraudScoreResponse(**result)
