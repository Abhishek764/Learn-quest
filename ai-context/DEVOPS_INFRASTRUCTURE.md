# LearnQuest — DevOps & Infrastructure

> **Last Updated:** 2026-05-14  |  **Owner:** DevOps/Platform  |  **Status:** Living Document

---

## Environments

| Environment | Purpose | Database | Deployment |
|-------------|---------|----------|------------|
| Local dev | Development | Neon.tech (shared) | `npm run dev` (concurrently) |
| Docker local | Integration testing | Local PostgreSQL container | `docker compose up` |
| Staging | Pre-production testing | Neon.tech staging branch | Docker Compose on VPS |
| Production | Live users | Neon.tech production | Kubernetes (target) |

---

## Docker Configuration

### Service Dockerfile (Standard)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
EXPOSE <PORT>
CMD ["node", "src/index.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### docker-compose.yml

Orchestrates: PostgreSQL + 6 backend services + 2 frontend apps. Key features:
- PostgreSQL 16 Alpine with persistent volume
- All services depend on PostgreSQL
- Environment variables from `.env` / inline
- Port mapping: 3000-3006 for backends, 5173/5174 for frontends (mapped to 80)

---

## CI/CD Pipeline (Target)

```yaml
# GitHub Actions
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci --legacy-peer-deps
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t learnquest/gateway ./gateway
      - run: docker build -t learnquest/auth-svc ./auth-svc
      # ... for each service

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f k8s/
```

---

## Kubernetes Architecture (Target)

```yaml
# Per-service deployment pattern
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aboa-svc
spec:
  replicas: 2                          # Scale ABOA for CPU
  selector:
    matchLabels: { app: aboa-svc }
  template:
    spec:
      containers:
        - name: aboa-svc
          image: learnquest/aboa-svc
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { cpu: 500m, memory: 512Mi }
          env:
            - name: DATABASE_URL
              valueFrom: { secretKeyRef: { name: db-secret, key: url } }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aboa-svc-hpa
spec:
  scaleTargetRef: { name: aboa-svc }
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource: { name: cpu, target: { averageUtilization: 70 } }
```

---

## Monitoring Stack (Target)

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection (request latency, error rates) |
| Grafana | Dashboards and alerting |
| OpenTelemetry | Distributed tracing across services |
| Loki | Log aggregation |

### Key Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| High error rate | > 5% 5xx in 5 min | Page on-call |
| Slow ABOA | p95 > 500ms | Scale up aboa-svc |
| DB connection exhaustion | Active connections > 80% | Scale pgBouncer |
| WebSocket drop | Connected clients drops > 20% in 1 min | Investigate rt-svc |

---

## Secrets Management

| Secret | Current | Target |
|--------|---------|--------|
| DATABASE_URL | `.env` file (gitignored) | Kubernetes Secret / AWS Secrets Manager |
| JWT_SECRET | `.env` file | Kubernetes Secret |
| REDIS_URL | `.env` file | Kubernetes ConfigMap |

**Rule:** Never commit secrets. `.env` is in `.gitignore`. Production uses environment-injected secrets.

---

## Backup Strategy

| Data | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| PostgreSQL | Continuous (Neon.tech) | 30 days point-in-time | Neon.tech built-in |
| Student mastery data | Critical — never lose | Indefinite | Database + daily S3 export |
| ABOA logs | Important for analysis | 1 year | Database |
| Media/avatars | As uploaded | Indefinite | S3-compatible storage |
