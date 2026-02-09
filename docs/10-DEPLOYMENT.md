# Deployment Architecture

This document describes **cloud-native deployment strategies** for Composerp.

## Deployment Principles

1. **Containerization** - All services containerized
2. **Kubernetes** - Container orchestration
3. **CI/CD** - Automated deployment pipelines
4. **Infrastructure as Code** - Terraform/CloudFormation
5. **Monitoring** - Comprehensive observability
6. **High Availability** - Multi-AZ deployment

---

## Container Strategy

### Docker Images

**Base Image:**
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
```

**Service-Specific Images:**
- `composerp/inventory-ledger:latest`
- `composerp/forecasting:latest`
- `composerp/replenishment:latest`

### Image Registry

- **Docker Hub** - Public registry
- **AWS ECR** - AWS Elastic Container Registry
- **Azure ACR** - Azure Container Registry
- **GCP GCR** - Google Container Registry

---

## Kubernetes Deployment

### Namespace Structure

```
composerp/
├── inventory-ledger/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── forecasting/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
└── replenishment/
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

### Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-ledger
  namespace: composerp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: inventory-ledger
  template:
    metadata:
      labels:
        app: inventory-ledger
    spec:
      containers:
      - name: inventory-ledger
        image: composerp/inventory-ledger:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: inventory-ledger
  namespace: composerp
spec:
  selector:
    app: inventory-ledger
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress Example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: inventory-ledger
  namespace: composerp
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - inventory.composerp.com
    secretName: inventory-tls
  rules:
  - host: inventory.composerp.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: inventory-ledger
            port:
              number: 80
```

---

## Database Deployment

### PostgreSQL Options

#### Option 1: Managed Service

**AWS RDS:**
- Multi-AZ deployment
- Automated backups
- Read replicas
- Managed upgrades

**Azure Database for PostgreSQL:**
- Flexible server
- High availability
- Automated backups

**GCP Cloud SQL:**
- High availability
- Automated backups
- Read replicas

#### Option 2: Self-Managed (Kubernetes)

**PostgreSQL Operator:**
- Crunchy Data PostgreSQL Operator
- Zalando PostgreSQL Operator

**StatefulSet:**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql
spec:
  serviceName: postgresql
  replicas: 1
  selector:
    matchLabels:
      app: postgresql
  template:
    metadata:
      labels:
        app: postgresql
    spec:
      containers:
      - name: postgresql
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: composerp
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
```

---

## Event Bus Deployment

### Kafka Deployment

**Option 1: Managed Service**
- AWS MSK (Managed Streaming for Kafka)
- Azure Event Hubs
- Confluent Cloud

**Option 2: Self-Managed (Kubernetes)**
- Strimzi Kafka Operator
- Confluent Operator

**Strimzi Example:**
```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: composerp-kafka
spec:
  kafka:
    replicas: 3
    listeners:
    - name: plain
      port: 9092
      type: internal
      tls: false
    - name: tls
      port: 9093
      type: internal
      tls: true
    storage:
      type: persistent-claim
      size: 100Gi
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 10Gi
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Inventory Ledger

on:
  push:
    branches: [main]
    paths:
      - 'apps/inventory-ledger/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Build Docker image
      run: |
        docker build -t composerp/inventory-ledger:${{ github.sha }} .
        docker tag composerp/inventory-ledger:${{ github.sha }} composerp/inventory-ledger:latest
    - name: Push to registry
      run: |
        docker push composerp/inventory-ledger:${{ github.sha }}
        docker push composerp/inventory-ledger:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/inventory-ledger \
          inventory-ledger=composerp/inventory-ledger:${{ github.sha }} \
          -n composerp
```

---

## Infrastructure as Code

### Terraform Example

```hcl
# Kubernetes cluster
resource "aws_eks_cluster" "composerp" {
  name     = "composerp"
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "composerp" {
  identifier     = "composerp-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.r5.xlarge"
  allocated_storage = 500
  storage_type     = "gp3"
  
  db_name  = "composerp"
  username = "admin"
  password = var.db_password
  
  backup_retention_period = 7
  multi_az                = true
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# MSK Kafka
resource "aws_msk_cluster" "composerp" {
  cluster_name           = "composerp-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type  = "kafka.m5.large"
    ebs_volume_size = 100
    client_subnets = aws_subnet.private[*].id
    security_groups = [aws_security_group.kafka.id]
  }
}
```

---

## Monitoring & Observability

### Metrics (Prometheus)

**Service Metrics:**
- Request rate
- Error rate
- Latency (p50, p95, p99)
- Active connections

**Business Metrics:**
- Transactions per second
- Inventory updates per second
- Purchase orders created
- Forecast accuracy

### Logging (ELK Stack)

**Log Aggregation:**
- Centralized logging
- Structured logs (JSON)
- Log retention (30 days)

### Tracing (Jaeger/Zipkin)

**Distributed Tracing:**
- Request tracing across services
- Performance analysis
- Dependency mapping

---

## High Availability

### Multi-AZ Deployment

**Kubernetes:**
- Pods distributed across availability zones
- Anti-affinity rules

**Database:**
- Multi-AZ RDS
- Read replicas in different AZs

**Event Bus:**
- Kafka brokers in multiple AZs
- Replication factor = 3

### Auto-Scaling

**Horizontal Pod Autoscaler:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: inventory-ledger-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: inventory-ledger
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Security

### Secrets Management

**Kubernetes Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  url: <base64-encoded>
  username: <base64-encoded>
  password: <base64-encoded>
```

**External Secrets:**
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: inventory-ledger-policy
spec:
  podSelector:
    matchLabels:
      app: inventory-ledger
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
```

---

*Next: [Scalability](./11-SCALABILITY.md)*
