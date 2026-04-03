# WEMA

Weather Event Money Assurance is a production-shaped MVP for automated income protection for food delivery riders in India.

## Monorepo Structure

- `backend` - Express API with MongoDB, RBAC, payout orchestration, and event processing
- `frontend` - React + Vite + Tailwind dashboards for riders and admins
- `fraud-service` - Python FastAPI microservice using Isolation Forest based fraud scoring

## Core Flow

1. System detects a weather or social disruption
2. Event is verified and stored
3. Riders are evaluated in strict order:
   - GPS inside calamity radius
   - Delivery zone overlaps affected area
   - Active delivery in progress
   - Fraud score check
4. Baseline earnings and loss window are computed
5. Claim is auto-paid, sent to admin review, or held for rider verification
6. Approved payouts are pushed to Razorpay UPI

## Automated Triggers

The backend now supports automated trigger creation for:

- Heavy rain
- Flood-like rainfall escalation
- Extreme heat
- Severe pollution
- Cyclone or severe storm conditions
- Earthquakes via public seismic feed matching

Weather triggers are monitored automatically from active rider zones using OpenWeather. Earthquakes are monitored from the USGS public daily feed. Social disruptions remain admin-reviewed.

## Running Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Fraud Service

```bash
cd fraud-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Folder Structure

```text
.
|-- backend
|   |-- src
|   |   |-- config
|   |   |-- constants
|   |   |-- controllers
|   |   |-- middleware
|   |   |-- models
|   |   |-- routes
|   |   |-- services
|   |   |-- utils
|   |   `-- seed
|-- frontend
|   `-- src
|       |-- api
|       |-- components
|       |-- context
|       |-- data
|       `-- pages
`-- fraud-service
    `-- app
        |-- models
        `-- services
```

## Backend Modules

- Auth Service: Firebase login, JWT issuance, role propagation
- Rider Service: plan selection, premium view, alerts, payout history, appeals
- Policy lifecycle: active policy records and weekly premium payment records
- Event Detection Service: weather ingest, social trigger ingest, event processing
- Eligibility Service: strict ordered checks and payout computation
- Fraud Service: anti-spoofing and Isolation Forest integration
- Payout Service: approved claim to UPI transfer flow
- Admin Service: social approval queue, fraud triage, claim review

## RBAC

- `verifyToken` validates JWT and loads the DB user

- `requireRole("RIDER")` protects rider-only routes
- `requireRole("ADMIN")` protects admin-only routes
- `verifySystemSecret` protects internal automation routes

## Key API Endpoints

### `POST /api/v1/auth/firebase-login`

```json
{
  "idToken": "firebase-id-token",
  "profile": {
    "name": "Eshwar",
    "role": "RIDER",
    "aadhaarVerified": true,
    "provider": "ZOMATO",
    "city": "Hyderabad",
    "zoneCode": "HYD-KUKATPALLY",
    "upiId": "eshwar@upi"
  }
}
```

### `GET /api/v1/rider/dashboard`

Returns rider profile, premium estimate, active alerts, recent claims, payout history, policy state, premium payments, appeals, complaints, and eligibility summary.

### `POST /api/v1/rider/provider-sync`

Demo-mode provider integration sync for active delivery verification.

```json
{
  "deliveryStatus": "PICKED_UP"
}
```

### `POST /api/v1/rider/subscribe`

Activates or renews the rider policy for the current plan.

```json
{
  "plan": "PRO",
  "autoRenew": false
}
```

### `PATCH /api/v1/admin/social-triggers/:eventId/decision`

```json
{
  "approved": true,
  "note": "Verified against local advisories and zone volume collapse"
}
```

### `POST /api/v1/system/events/social-detection`

```json
{
  "eventType": "BANDH",
  "city": "Mumbai",
  "zoneCode": "MUM-CENTRAL",
  "center": { "lat": 19.076, "lng": 72.8777 },
  "radiusKm": 8,
  "affectedPolygon": [
    { "lat": 19.07, "lng": 72.87 },
    { "lat": 19.08, "lng": 72.88 }
  ],
  "thresholdSnapshot": {
    "orderDropPercent": 70,
    "newsMatches": 2
  },
  "lossWindowStart": "2026-03-30T08:00:00.000Z",
  "lossWindowEnd": "2026-03-30T18:00:00.000Z"
}
```

## Claim Decision Logic

- Weather and environmental triggers can auto-pay when the fraud risk tier is `LOW`
- Social triggers always route to `ADMIN_REVIEW`, even if fraud is low
- `MEDIUM` risk also routes to `ADMIN_REVIEW`
- `HIGH` and `REPEAT_HIGH` route to `HOLD_RIDER_VERIFICATION`

## Payout Formula

```text
Payout = (Average hourly earnings x Lost hours) x Severity factor
```

Weekly caps are enforced from the chosen plan:

- Basic: Rs 300
- Standard: Rs 600
- Pro: Rs 1200
- Premium: Rs 2000

## Fraud Signals Sent To Python Service

- GPS and route continuity
- Device fingerprint reuse
- IP and network anomalies
- Accelerometer and gyroscope realism
- Delivery timing near alert fire time
- Historical claim and fraud patterns
- Cluster bursts from the same subnet or device group
- Weather cross-verification confidence

## Manual Admin Setup

Create the one manual admin account:

```bash
cd backend
npm run seed:admin -- 2300031934cseh1@gmail.com "" admin Sutej@2005
```
