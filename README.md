# CogniDispatch Dispatch Service

The **Dispatch Service** is the telemetry and orchestration core of the **CogniDispatch** platform. It manages real-time emergency dispatch creation, tracks technician positions relative to the customer location using the Haversine formula, and orchestrates live status updates via bidirectional WebSockets (Socket.IO).

## 🚀 Technology Stack
*   **Runtime**: Node.js (v18+)
*   **Web Framework**: Express.js
*   **WebSockets**: Socket.IO (v4+)
*   **Mathematical Utilities**: Haversine Formula for geo-distance and ETA tracking
*   **Security & Networking**: CORS, Helmet

---

## 📁 Repository Structure
```
├── shared/               # Shared logic (CosmosDB adapter, static seeds)
├── Dockerfile            # Multi-stage production container build
├── package.json          # Dependency config
└── server.js             # Telemetry logic and Socket.io event loop
```

---

## ⚙️ Environment Variables & Config

This service binds both HTTP and WebSocket protocols to the same port.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Listening TCP Port | `5000` |
| `MONGODB_URI_FILE` | Path to file containing Cosmos DB connection string | *None* |

---

## 🛣️ API and WebSocket Endpoints

### 1. HTTP REST APIs
All HTTP routes are prefixed with `/api/dispatches`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/dispatches/health` | Service health status check |
| **GET** | `/api/dispatches/:id` | Returns current database state of a specific dispatch record |

### 2. WebSocket Events (Socket.IO)

Clients connect to the root namespace. The service listens for and emits the following socket payloads:

#### Inbound events (Service Listens)
*   `join-room (roomId)`: Registers client/technician socket to a specific channel.
*   `start-tracking (payload)`: Creates a new dispatch record in Cosmos DB and alerts the target technician.
*   `accept-job (payload)`: Marks a dispatch status as `EN_ROUTE` and flags the technician as `busy`.
*   `update-location (payload)`: Receives real-time GPS coordinates from the technician, calculates distance using Haversine formula, estimates ETA, and broadcasts updates.
*   `decline-job (payload)`: Cancels the request and updates dispatch status to `DECLINED`.
*   `verify-otp (payload)`: Validates input OTP to complete the dispatch service request.

#### Outbound events (Service Emits)
*   `dispatch-created`: Sends generated ID and OTP code back to the dispatch creator.
*   `new-job-request`: Alerts the technician about the pending emergency request.
*   `job-accepted`: Notifies the homeowner/client that support is on the way.
*   `tech-location-update`: Broadcasts real-time coordinate, distance, and ETA increments.
*   `otp-verified`: Confirms successful delivery and completes the dispatch request.

---

## 🛠️ Local Development

### 1. Prerequisites
*   Node.js (v18+)
*   A running local MongoDB instance (or Cosmos DB emulator)

### 2. Startup Commands
From the service root:
```bash
npm install
npm start
```
The application HTTP and WebSocket server starts at `http://localhost:5000/`.

---

## 🐳 Docker Container Build

```bash
docker build -t cogniregistry.azurecr.io/cogni-dispatch-service:latest .
```
