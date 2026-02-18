# Backend Implementation - Validation Checklist

This document provides step-by-step verification that all backend components are working correctly.

## ✅ Prerequisites Check

```bash
# Check Docker is installed
docker --version
# Expected: Docker version 20.10+

# Check Docker Compose is installed
docker-compose --version
# Expected: Docker Compose version 2.0+

# Check Node.js is installed
node --version
# Expected: v18+

# Check npm/pnpm
npm --version
```

---

## 🚀 Phase 1: Infrastructure Setup

### 1.1 Build & Start All Services

```bash
# Navigate to project
cd AngeBae

# Start all services
make up

# Expected output:
# ✅ All services started!
# Waiting for services to be healthy...
```

### 1.2 Verify Services Are Running

```bash
# Check all containers
docker-compose ps

# Expected status: Up (all 8+ containers)
# - postgres
# - redis
# - minio
# - mailhog
# - backend
# - ocr-worker
# - pgadmin
```

### 1.3 Verify Service Logs

```bash
# Check backend is running
make backend-logs

# Look for: "started server on... url: http://localhost:3000"

# Check OCR worker
make ocr-logs

# Look for: "celery@... ready to accept tasks"

# Check database
make db-logs

# Look for: "ready to accept connections"
```

---

## 📦 Phase 2: Database Setup

### 2.1 Run Migrations

```bash
# Run database migrations
make migrate

# Expected output:
# ✅ Migrations complete!
```

### 2.2 Verify Database Schema

```bash
# Access database shell
make db-shell

# In psql shell, run:
\dt

# Expected tables:
# - admins
# - products
# - product_variants
# - categories
# - orders
# - order_items
# - media
# - ocr_jobs
# - product_candidates
# - sessions
```

### 2.3 Check Extensions

```bash
# In psql shell, run:
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');

# Expected:
# uuid-ossp
# pgcrypto
# pg_trgm
```

---

## 👤 Phase 3: Admin User Setup

### 3.1 Create Admin User

```bash
# Seed admin with default credentials
make seed-admin

# Expected output:
# ✅ Admin created successfully!
# 🔑 Login credentials:
#    Email: admin@angebae.local
#    Password: admin123
```

### 3.2 Verify Admin in Database

```bash
# Access database
make db-shell

# Query admin (in psql):
SELECT id, email, active FROM admins;

# Expected:
# One row with:
# - email: admin@angebae.local
# - active: true
```

---

## 🏥 Phase 4: Health Checks

### 4.1 Backend Health Endpoint

```bash
# Check all services
curl http://localhost:3000/api/health | jq

# Expected response (200):
# {
#   "status": "ok",
#   "timestamp": "2024-02-17T...",
#   "services": {
#     "database": "ok",
#     "storage": "ok",
#     "queue": "ok"
#   }
# }
```

### 4.2 Individual Service Checks

```bash
# PostgreSQL
docker-compose exec postgres pg_isready
# Expected: accepting connections

# Redis
docker-compose exec redis redis-cli ping
# Expected: PONG

# MinIO
curl http://localhost:9000/minio/health/live
# Expected: 200 OK
```

---

## 🔐 Phase 5: Admin Authentication

### 5.1 Login Test

```bash
# Attempt admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@angebae.local",
    "password": "admin123"
  }' | jq

# Expected response (200):
# {
#   "admin": {
#     "id": "uuid",
#     "email": "admin@angebae.local",
#     "name": "admin",
#     "active": true
#   },
#   "token": "eyJ0eXAiOiJ..."
# }

# Note: Response also sets admin_auth cookie
```

### 5.2 Extract JWT Token

```bash
# Get token from login response
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@angebae.local","password":"admin123"}' | jq -r '.token')

echo $TOKEN
# Expected: JWT token (3 parts separated by dots)
```

### 5.3 Logout Test

```bash
# Logout and clear cookie
curl -X POST http://localhost:3000/api/admin/logout \
  -H "Content-Type: application/json" | jq

# Expected response (200):
# {
#   "success": true,
#   "message": "Logged out successfully"
# }
```

---

## 📁 Phase 6: Media Upload

### 6.1 Create Test PDF

```bash
# Create a simple test PDF (if you don't have one)
# Using command line (requires `apt install texlive-latex-base` on Linux)
# Or just use an existing PDF file

# For this test, use any PDF file:
ls -la test-file.pdf  # Should exist
```

### 6.2 Upload Media

```bash
# Save token for reuse
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@angebae.local","password":"admin123"}' | jq -r '.token')

# Upload file
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@sample.pdf" \
  -F "type=pdf" \
  -H "Authorization: Bearer $TOKEN" | jq

# Expected response (201):
# {
#   "success": true,
#   "media": {
#     "id": "uuid",
#     "type": "pdf",
#     "url": "/api/media/uuid",
#     "minioKey": "pdfs/...",
#     "fileSize": XXXXXX,
#     "mimeType": "application/pdf"
#   }
# }

# Save the media ID for next test
MEDIA_ID="uuid-from-response"
```

### 6.3 Verify File in MinIO

```bash
# Access MinIO console
# http://localhost:9001

# Login: minioadmin / minioadmin
# Navigate to: Buckets > angebae-media
# Should see uploaded PDF file

# Or via CLI:
docker-compose exec minio mc ls local/angebae-media
```

---

## 🧠 Phase 7: OCR Processing

### 7.1 Enqueue OCR Job

```bash
# Save media ID from upload test
MEDIA_ID="uuid-from-upload"

# Enqueue OCR job
curl -X POST http://localhost:3000/api/ocr/enqueue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"mediaId\":\"$MEDIA_ID\"}" | jq

# Expected response (201):
# {
#   "success": true,
#   "ocrJob": {
#     "id": "uuid",
#     "status": "pending",
#     "mediaId": "uuid",
#     "jobQueueId": 1,
#     "createdAt": "2024-02-17T..."
#   }
# }

# Save the OCR job ID
OCR_JOB_ID="uuid-from-response"
```

### 7.2 Monitor OCR Worker

```bash
# In separate terminal, watch worker logs
make ocr-logs

# Expected to see:
# INFO:tasks:Starting OCR job ...
# INFO:tasks:Downloading ... from MinIO
# INFO:tasks:Extracting text from pdf file
# INFO:tasks:Found X product candidates
# INFO:tasks:OCR job ... completed successfully
```

### 7.3 Check OCR Job Status

```bash
# Wait a few seconds, then check status
sleep 5

# Get job status (every 2-3 seconds)
curl http://localhost:3000/api/ocr/jobs/$OCR_JOB_ID | jq

# Expected progression:
# 1. status: "pending"
# 2. status: "processing"
# 3. status: "done"

# Final response with done status:
# {
#   "id": "uuid",
#   "mediaId": "uuid",
#   "status": "done",
#   "result": {
#     "totalPages": X,
#     "candidatesFound": Y,
#     "candidates": [...]
#   },
#   "completedAt": "2024-02-17T..."
# }
```

### 7.4 Verify Results in Database

```bash
# Access database
make db-shell

# Query OCR results (in psql):
SELECT id, status, completed_at FROM ocr_jobs ORDER BY created_at DESC LIMIT 1;

# Expected: One row with status 'done' and a completed_at timestamp

# Query product candidates:
SELECT extracted_title, extracted_price, confidence FROM product_candidates
WHERE ocr_job_id = 'ocr-job-uuid';

# Expected: Rows with extracted products and confidence scores
```

---

## 📧 Phase 8: Email (MailHog)

### 8.1 Access MailHog

```bash
# Open in browser
http://localhost:8025

# Expected:
# - MailHog web interface
# - Shows "0 messages" (no emails sent yet)
```

### 8.2 Send Test Email (Optional)

```bash
# Test email functionality by checking SMTP connectivity
docker-compose exec backend node -e \
  "const nodemailer = require('nodemailer'); \
   const transporter = nodemailer.createTransport({host: 'mailhog', port: 1025}); \
   transporter.verify((err) => console.log(err ? 'Failed' : 'Success'))"

# Expected: Success
```

---

## 🗄️ Phase 9: PgAdmin

### 9.1 Access PgAdmin

```bash
# Open in browser
http://localhost:5050

# Login: admin@admin.com / admin
```

### 9.2 Connect Database

```bash
# In PgAdmin:
# 1. Click "Add New Server"
# 2. Name: "Angebae Local"
# 3. Connection tab:
#    - Host: postgres
#    - Port: 5432
#    - Database: angebae_db
#    - Username: angebae_user
#    - Password: angebae_password
# 4. Click "Save"

# Expected: Connected to database
```

---

## 🎯 Phase 10: Complete Flow Test

### 10.1 End-to-End Test

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@angebae.local","password":"admin123"}' | jq -r '.token')

# 2. Upload PDF
MEDIA_ID=$(curl -s -X POST http://localhost:3000/api/media/upload \
  -F "file=@sample.pdf" \
  -F "type=pdf" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.media.id')

# 3. Enqueue OCR
OCR_JOB=$(curl -s -X POST http://localhost:3000/api/ocr/enqueue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"mediaId\":\"$MEDIA_ID\"}" | jq -r '.ocrJob.id')

# 4. Wait for processing
sleep 10

# 5. Check results
curl http://localhost:3000/api/ocr/jobs/$OCR_JOB | jq

# Expected: Complete flow with OCR results
```

---

## 🚨 Troubleshooting Validation

### If Backend Won't Start

```bash
# Check logs
make backend-logs

# Common issues:
# - Port 3000 in use: docker ps | grep 3000
# - Database not ready: docker-compose restart postgres
# - Dependencies missing: npm install
```

### If Database Connection Fails

```bash
# Verify database is running
docker-compose ps | grep postgres

# Test connection
docker-compose exec postgres pg_isready

# Check DATABASE_URL
echo $DATABASE_URL
```

### If OCR Worker Won't Process

```bash
# Check worker logs
make ocr-logs

# Verify Redis connection
docker-compose exec redis redis-cli ping

# Check Celery tasks
docker-compose exec redis redis-cli KEYS "celery*"
```

### If MinIO Upload Fails

```bash
# Check MinIO health
curl http://localhost:9000/minio/health/live

# Access MinIO console
# http://localhost:9001 (minioadmin/minioadmin)

# Check disk space
docker-compose exec minio df -h
```

---

## ✅ Final Validation Checklist

- [ ] All Docker containers running (`docker-compose ps`)
- [ ] Database migrations complete (`make migrate`)
- [ ] Admin user created (`make seed-admin`)
- [ ] Health check passing (`curl /api/health`)
- [ ] Admin login works (`POST /api/admin/login`)
- [ ] Media upload works (`POST /api/media/upload`)
- [ ] OCR enqueue works (`POST /api/ocr/enqueue`)
- [ ] OCR processing completes (`GET /api/ocr/jobs/:id`)
- [ ] Results in database (`SELECT * FROM ocr_jobs`)
- [ ] MinIO console accessible (http://localhost:9001)
- [ ] MailHog accessible (http://localhost:8025)
- [ ] PgAdmin accessible (http://localhost:5050)

---

## 🎯 Success Criteria

**All Phase Tests Passing?** ✅ **READY FOR DEVELOPMENT**

If any phase fails:
1. Check the phase-specific troubleshooting
2. Review relevant documentation (BACKEND.md)
3. Check service logs with `make logs`

---

## 📊 Performance Baseline

After successful validation:

```bash
# Expected response times:
# - API health check: < 100ms
# - Admin login: < 500ms
# - File upload (1MB): < 2s
# - OCR job (3-page PDF): 10-30s
# - Database query: < 100ms

# Expected CPU/Memory (at idle):
# - Backend: ~50MB RAM
# - PostgreSQL: ~100MB RAM
# - Redis: ~20MB RAM
# - OCR Worker: ~300MB RAM (increases during processing)
```

---

**Last Updated**: February 17, 2024  
**Status**: 🟢 Ready for Use
