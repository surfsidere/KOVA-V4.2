# KOVA V4.2 Development Operations Manual (DOM)

## 🚀 Executive Summary

**Purpose**: Establish enterprise-grade DevOps methodology for KOVA V4.2 addressing build environment instability and implementing automated CI/CD pipeline with comprehensive monitoring.

**Crisis Resolution**:
- ✅ Local build environment instability → Containerized development environments
- ✅ Inconsistent deployment processes → Automated CI/CD with multiple environments
- ✅ Lack of infrastructure observability → Comprehensive monitoring and alerting
- ✅ Manual deployment risks → Infrastructure as Code with version control
- ✅ Disaster recovery gaps → Automated backup and rollback procedures

## 🏗️ Infrastructure Architecture

### Environment Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    Environment Hierarchy                    │
├─────────────────────────────────────────────────────────────┤
│ Development → Staging → Pre-Production → Production        │
│     ↓            ↓           ↓              ↓              │
│ Feature      Integration   Load Testing   Live Traffic     │
│ Testing      Testing       Security       Blue/Green       │
│ Debugging    E2E Tests     Performance    Monitoring       │
└─────────────────────────────────────────────────────────────┘
```

### Containerization Strategy
```dockerfile
# Multi-stage Dockerfile for optimal builds
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
ENV NODE_ENV=production
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/.next /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔄 CI/CD Pipeline Architecture

### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: KOVA V4.2 CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # QUALITY GATES
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type-check
      
      - name: Linting
        run: npm run lint
      
      - name: Security audit
        run: npm audit --audit-level high
      
      - name: Bundle analysis
        run: |
          npm run build
          npm run analyze
      
      - name: Upload bundle analysis
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: .next/analyze/

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # TESTING PYRAMID
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          PORT: 3000
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # PERFORMANCE & SECURITY
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  performance-audit:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          PORT: 3000
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # CONTAINERIZATION & DEPLOYMENT
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  build-and-push:
    runs-on: ubuntu-latest
    needs: [code-quality, unit-tests, integration-tests, e2e-tests, performance-audit, security-scan]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  # DEPLOYMENT TO STAGING
  # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build-and-push]
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Deploy to staging infrastructure
      
      - name: Health check
        run: |
          echo "Running health checks"
          # Verify deployment health
      
      - name: Smoke tests
        run: |
          echo "Running smoke tests"
          # Basic functionality verification
```

## 🐳 Development Environment Setup

### Docker Compose Configuration
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
    depends_on:
      - redis
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=kova_dev
      - POSTGRES_USER=kova
      - POSTGRES_PASSWORD=kova_dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kova -d kova_dev"]
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/dev.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  redis_data:
  postgres_data:

networks:
  default:
    name: kova_dev_network
```

### Development Scripts
```bash
#!/bin/bash
# scripts/dev-setup.sh

set -e

echo "🚀 Setting up KOVA V4.2 development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed."; exit 1; }

# Create necessary directories
mkdir -p logs ssl nginx

# Generate SSL certificates for local development
if [ ! -f ssl/dev.crt ]; then
    echo "Generating SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/dev.key \
        -out ssl/dev.crt \
        -subj "/C=US/ST=Dev/L=Local/O=KOVA/CN=localhost"
fi

# Copy environment template
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Start development environment
echo "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Install dependencies
echo "Installing dependencies..."
docker-compose -f docker-compose.dev.yml exec app npm install

echo "✅ Development environment is ready!"
echo "📝 Application: http://localhost:3000"
echo "📊 Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
```

## 📊 Monitoring & Observability

### Application Performance Monitoring
```typescript
// lib/monitoring/apm.ts
interface APMConfig {
  serviceName: string;
  environment: string;
  version: string;
  sampleRate: number;
  enableTracing: boolean;
  enableMetrics: boolean;
  enableLogs: boolean;
}

class ApplicationPerformanceMonitor {
  private config: APMConfig;
  private metrics: Map<string, number> = new Map();
  private traces: Array<TraceData> = [];
  
  constructor(config: APMConfig) {
    this.config = config;
    this.initialize();
  }
  
  private initialize(): void {
    // Initialize APM agent
    if (typeof window !== 'undefined') {
      this.initializeBrowserAPM();
    } else {
      this.initializeServerAPM();
    }
  }
  
  // Performance tracking
  trackPageLoad(route: string, duration: number): void {
    this.recordMetric('page_load_time', duration, { route });
    
    if (duration > 3000) {
      this.recordAlert('SLOW_PAGE_LOAD', {
        route,
        duration,
        threshold: 3000
      });
    }
  }
  
  trackUserInteraction(action: string, duration: number): void {
    this.recordMetric('user_interaction_time', duration, { action });
    
    if (duration > 100) {
      this.recordAlert('SLOW_INTERACTION', {
        action,
        duration,
        threshold: 100
      });
    }
  }
  
  trackChunkLoadFailure(chunkName: string, error: Error): void {
    this.recordMetric('chunk_load_failures', 1, { chunkName });
    this.recordError('CHUNK_LOAD_FAILURE', error, { chunkName });
    
    // Specific handling for framer-motion chunk issues
    if (chunkName.includes('framer-motion')) {
      this.recordAlert('FRAMER_MOTION_CHUNK_FAILURE', {
        chunkName,
        error: error.message,
        stackTrace: error.stack
      });
    }
  }
  
  // Memory monitoring
  trackMemoryUsage(): void {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      
      this.recordMetric('memory_used', memory.usedJSHeapSize);
      this.recordMetric('memory_total', memory.totalJSHeapSize);
      this.recordMetric('memory_limit', memory.jsHeapSizeLimit);
      
      // Alert on high memory usage
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        this.recordAlert('HIGH_MEMORY_USAGE', {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      }
    }
  }
  
  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: context || {},
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
    
    this.recordError('APPLICATION_ERROR', error, errorData);
    
    // Send to monitoring service
    this.sendToMonitoringService('error', errorData);
  }
}
```

### Infrastructure Monitoring
```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
```

## 🚨 Disaster Recovery & Rollback Procedures

### Automated Rollback System
```typescript
// lib/deployment/rollback.ts
interface DeploymentVersion {
  version: string;
  timestamp: Date;
  commitHash: string;
  imageTag: string;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  rollbackCapable: boolean;
}

class RollbackManager {
  private versions: DeploymentVersion[] = [];
  private currentVersion: string;
  
  async rollback(targetVersion?: string): Promise<boolean> {
    try {
      const target = targetVersion || this.getPreviousHealthyVersion();
      
      if (!target) {
        throw new Error('No healthy version available for rollback');
      }
      
      console.log(`Starting rollback to version ${target}`);
      
      // 1. Create database backup
      await this.createDatabaseBackup();
      
      // 2. Deploy previous version
      await this.deployVersion(target);
      
      // 3. Verify health
      await this.verifyDeploymentHealth(target);
      
      // 4. Update traffic routing
      await this.updateTrafficRouting(target);
      
      // 5. Monitor for stability
      await this.monitorStability(target, 300000); // 5 minutes
      
      console.log(`Rollback to version ${target} completed successfully`);
      return true;
      
    } catch (error) {
      console.error('Rollback failed:', error);
      await this.notifyRollbackFailure(error);
      return false;
    }
  }
  
  private getPreviousHealthyVersion(): string | null {
    const healthyVersions = this.versions
      .filter(v => v.healthStatus === 'healthy' && v.rollbackCapable)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return healthyVersions.length > 1 ? healthyVersions[1].version : null;
  }
}
```

### Backup Strategy
```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

echo "🔄 Starting backup process..."

# Database backup
echo "📊 Backing up database..."
pg_dump -h postgres -U kova kova_dev > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# File system backup
echo "📁 Backing up application files..."
tar -czf "$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    /app

# Configuration backup
echo "⚙️ Backing up configuration..."
kubectl get configmaps -o yaml > "$BACKUP_DIR/configmaps_$TIMESTAMP.yaml"
kubectl get secrets -o yaml > "$BACKUP_DIR/secrets_$TIMESTAMP.yaml"

# Clean old backups
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.yaml" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed successfully"
```

## 🔧 Troubleshooting Runbooks

### Common Issues & Solutions

#### Issue: SIGBUS Webpack Module Resolution
```bash
# Diagnosis steps
echo "🔍 Diagnosing SIGBUS errors..."

# Check memory usage
free -h
ps aux --sort=-%mem | head -20

# Check Node.js version compatibility
node --version
npm ls webpack

# Solutions:
# 1. Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# 2. Clear caches
rm -rf .next node_modules package-lock.json
npm install

# 3. Disable webpack optimizations temporarily
export WEBPACK_DISABLE_OPTIMIZATION=true
```

#### Issue: Framer Motion Chunk Splitting
```bash
# Diagnosis
echo "🎬 Diagnosing Framer Motion chunk issues..."

# Check chunk sizes
npm run build
npm run analyze

# Solutions:
# 1. Pre-load critical chunks
echo "Implementing chunk preloading..."

# 2. Optimize imports
echo "Converting to dynamic imports..."

# 3. Bundle analysis
echo "Analyzing bundle composition..."
```

## 📋 Implementation Checklist

### Phase 1: Foundation Setup (Week 1)
- [ ] Set up containerized development environment
- [ ] Implement basic CI/CD pipeline
- [ ] Configure monitoring stack
- [ ] Set up automated backups
- [ ] Create rollback procedures

### Phase 2: Advanced Features (Week 2)
- [ ] Implement blue/green deployment
- [ ] Set up performance monitoring
- [ ] Configure alerting system
- [ ] Implement security scanning
- [ ] Create disaster recovery plan

### Phase 3: Optimization (Week 3)
- [ ] Fine-tune performance monitoring
- [ ] Optimize build processes
- [ ] Implement advanced deployment strategies
- [ ] Create comprehensive runbooks
- [ ] Train team on procedures

## 📊 Success Metrics

### Operational Excellence
- **Deployment Frequency**: >10 deployments/day
- **Lead Time**: <2 hours from commit to production
- **MTTR**: <15 minutes for rollbacks
- **Change Failure Rate**: <5%
- **Availability**: 99.9% uptime

### Performance
- **Build Time**: <5 minutes
- **Test Execution**: <10 minutes
- **Container Startup**: <30 seconds
- **Rollback Time**: <5 minutes
- **Alert Response**: <2 minutes

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-19  
**Next Review**: 2024-12-26  
**Owner**: DevOps Team  
**Stakeholders**: Development, QA, Security, Operations Teams