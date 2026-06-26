# Luminate

Event-Driven Log Aggregation & Observability Platform

## Structure
- `/backend` — Spring Boot 3, Java 21, Kafka, Elasticsearch, Redis
- `/frontend` — Next.js 14, Recharts, Tailwind CSS

## Quick Start

### Backend
```bash
cd backend
docker-compose -f docker/docker-compose.yml up -d
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Ports
- Backend API: http://localhost:8080
- Frontend Dashboard: http://localhost:3000
- Elasticsearch: http://localhost:9200