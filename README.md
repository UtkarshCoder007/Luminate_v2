# Luminate

A production-grade log aggregation and observability platform. Luminate ingests logs from distributed microservices, indexes them for sub-second search, and surfaces anomalies through a statistical alerting engine.

---

## Features

- **Batch ingestion** — `POST /api/v1/logs/batch` accepts log payloads and returns `202 Accepted` immediately, never blocking the caller
- **Kafka buffering** — decouples ingestion speed from indexing speed, absorbs traffic spikes without data loss
- **Dead Letter Topic** — logs that fail all retry attempts are routed to a DLT for zero data loss and manual replay
- **Full-text search** — fuzzy search across `message` and `stackTrace` fields with hard filters on service, level, and time range
- **Distributed tracing** — reconstruct the exact journey of any request across services using a shared `traceId`
- **Z-score alerting** — self-calibrating anomaly detection based on each service's 7-day historical baseline, fires webhooks on breach
- **Poisoned baseline protection** — baseline refresh is frozen during active incidents to prevent corruption
- **Automated data lifecycle** — daily scheduled job deletes indices older than the configured retention window
- **Live dashboard** — real-time log tail via SSE, volume chart, search UI, and active anomaly banner

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring WebFlux |
| Message Broker | Apache Kafka |
| Search & Storage | Elasticsearch 8.x |
| Cache & State | Redis 7 |
| Frontend | Next.js 14, Recharts, Tailwind CSS |
| Infrastructure | Docker, Docker Compose |

---

## Project Structure

```
Luminate/
├── backend/        # Spring Boot application
│   ├── src/
│   ├── docker/     # docker-compose.yml for Kafka, Elasticsearch, Redis
│   └── pom.xml
└── frontend/       # Next.js dashboard
    ├── app/
    └── lib/
```

---

## Quick Start

**Prerequisites:** Java 21, Docker Desktop, Node.js 18+

### 1. Start infrastructure

```bash
cd backend
docker-compose -f docker/docker-compose.yml up -d
```

### 2. Start the backend

```bash
./mvnw spring-boot:run
```

API runs on `http://localhost:8080`

### 3. Start the dashboard

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs on `http://localhost:3000`

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/logs/batch` | POST | Ingest a batch of log payloads |
| `/api/v1/search` | GET | Full-text search with filters |
| `/api/v1/logs/trace/{traceId}` | GET | Reconstruct a distributed trace |
| `/api/v1/logs/stream` | GET | SSE stream for live log tailing |
| `/api/v1/metrics/anomalies` | GET | Active Z-score alert breaches |
| `/api/v1/metrics/volume` | GET | Log volume aggregated by time interval |

### Log Payload Schema

```json
{
  "timestamp": "2026-06-23T10:00:00Z",
  "serviceName": "payment-service",
  "logLevel": "ERROR",
  "message": "NullPointerException at PaymentProcessor.java:84",
  "traceId": "abc-123-xyz",
  "stackTrace": "at com.payment.PaymentProcessor.process(PaymentProcessor.java:84)"
}
```

Valid log levels: `DEBUG` `INFO` `WARN` `ERROR` `FATAL`

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker |
| `ELASTICSEARCH_URI` | `http://localhost:9200` | Elasticsearch endpoint |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ALERT_WEBHOOK_URL` | — | Webhook URL for alert dispatch |
| `LOG_RETENTION_DAYS` | `15` | Days before index deletion |
| `RATE_LIMIT_PER_MINUTE` | `1000` | Max logs per service per minute |
| `ZSCORE_THRESHOLD` | `3.0` | Anomaly detection sensitivity |

---

## Author

**Utkarsh Jha**
