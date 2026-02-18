# Angebae Backend - Complete Documentation

## 📋 Overview

This project is a **Next.js + PostgreSQL** e-commerce platform with a complete backend infrastructure featuring:

- ✅ **Database**: PostgreSQL 15 (Docker)
- ✅ **Job Queue**: Redis + BullMQ (Node.js) / Celery (Python)
- ✅ **File Storage**: MinIO (S3-compatible)
- ✅ **OCR Processing**: Python Testessract + PyMuPDF
- ✅ **Email**: MailHog (development)
- ✅ **Admin Auth**: bcrypt + JWT
- ✅ **Development**: Single command startup with Docker Compose

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (v20.10+)
- **Node.js** 18+ (for local development)
- **Python** 3.11+ (for OCR worker, if running locally)

### Launch Everything

```bash
# Clone and navigate to project
cd AngeBae

# Start all services (Postgres, Redis, MinIO, MailHog, Backend, OCR Worker)
make up

# Run migrations and seed admin
make migrate
make seed-admin

# Check service health
make health
```

**That's it!** All services are now running:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | `http://localhost:3000` | - |
| API Docs | `http://localhost:3000/api` | - |
| MinIO Console | `http://localhost:9001` | `minioadmin` / `minioadmin` |
| MailHog Web | `http://localhost:8025` | - |
| PgAdmin | `http://localhost:5050` | `admin@admin.com` / `admin` |
| Database | `localhost:5432` | `angebae_user` / `angebae_password` |
| Redis | `localhost:6379` | - |

---

## 📦 Architecture

### Service Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│                      http://3000                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend API Routes                         │
│              /api/admin, /api/media, /api/ocr               │
│                  /api/products, /api/orders                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────┐
    │                                             │
    ↓                    ↓                    ↓   ↓
┌────────────┐  ┌──────────────┐  ┌────────────┐ ┌─────────┐
│ PostgreSQL │  │    Redis     │  │   MinIO    │ │MailHog │
│  (DB)      │  │  (JobQueue)  │  │ (Storage)  │ │ (Email) │
└────────────┘  └──────────────┘  └────────────┘ └─────────┘
                        ↓
            ┌──────────────────────┐
            │   Celery Workers     │
            │  - OCR Processing    │
            │  - PDF Extraction    │
            │  - Text Parsing      │
            └──────────────────────┘
```

### Database Schema

**Key Tables:**

- `admins` - Admin users with bcrypt hashed passwords
- `products` - Product catalog (title, SKU, category, etc.)
- `product_variants` - Product variants (price, stock, attributes)
- `categories` - Product categories (hierarchical)
- `offers` - Time-limited price offers
- `orders` - Customer orders (customer_data as JSONB)
- `order_items` - Order line items
- `media` - File uploads (images, PDFs, videos)
- `ocr_jobs` - OCR processing jobs and results
- `product_candidates` - Extracted products from OCR

**Full schema**: See [db/migrations/001_init.sql](db/migrations/001_init.sql)

---

## 📚 API Endpoints

### Authentication

#### `POST /api/admin/login`
Admin login endpoint.

**Request:**
```json
{
  "email": "admin@angebae.local",
  "password": "admin123"
}
```

**Response (201):**
```json
{
  "admin": {
    "id": "uuid",
    "email": "admin@angebae.local",
    "name": "admin",
    "active": true
  },
  "token": "jwt-token"
}
```

Sets secure httpOnly cookie: `admin_auth` (24h expiry)

---

### Media Upload

#### `POST /api/media/upload`
Upload media files (images, PDFs, videos) to MinIO.

**Authentication:** Required (admin_auth cookie)

**Request (multipart/form-data):**
```
file: <binary file>
type: "image" | "pdf" | "video"
productId (optional): "uuid"
```

**Response (201):**
```json
{
  "success": true,
  "media": {
    "id": "uuid",
    "type": "pdf",
    "url": "/api/media/uuid",
    "minioKey": "pdfs/1707-abc123.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "productId": null
  }
}
```

**Limits:**
- Max file size: 100MB
- Allowed types: `image`, `pdf`, `video`

---

### OCR Processing

#### `POST /api/ocr/enqueue`
Enqueue a PDF for OCR processing.

**Authentication:** Required

**Request:**
```json
{
  "mediaId": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "ocrJob": {
    "id": "uuid",
    "status": "pending",
    "mediaId": "uuid",
    "jobQueueId": 1,
    "createdAt": "2024-02-17T10:30:00Z"
  }
}
```

#### `GET /api/ocr/jobs/:id`
Get OCR job status and results.

**Response (200):**
```json
{
  "id": "uuid",
  "mediaId": "uuid",
  "status": "done",
  "result": {
    "totalPages": 5,
    "candidatesFound": 12,
    "candidates": [
      {
        "title": "Product Name",
        "price": 99.99,
        "sku": "SKU123",
        "confidence": 0.85
      }
    ]
  },
  "confidenceScores": { ... },
  "createdAt": "2024-02-17T10:30:00Z",
  "completedAt": "2024-02-17T10:45:00Z"
}
```

**Status values:** `pending`, `processing`, `done`, `failed`

---

### Health Check

#### `GET /api/health`
Check all backend services health.

**Response (200 - all healthy):**
```json
{
  "status": "ok",
  "timestamp": "2024-02-17T10:30:00Z",
  "services": {
    "database": "ok",
    "storage": "ok",
    "queue": "ok"
  }
}
```

**Response (503 - degraded):**
```json
{
  "status": "degraded",
  "timestamp": "2024-02-17T10:30:00Z",
  "services": {
    "database": "ok",
    "storage": "down",
    "queue": "ok"
  }
}
```

---

## 🔧 Configuration

### Environment Variables

**Create `.env.local` (development) or use Docker env:**

```bash
# Database
DATABASE_URL=postgresql://angebae_user:angebae_password@localhost:5432/angebae_db
POSTGRES_USER=angebae_user
POSTGRES_PASSWORD=angebae_password
POSTGRES_DB=angebae_db

# Redis (Job Queue)
REDIS_URL=redis://localhost:6379

# MinIO (S3 Storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=angebae-media

# Email (MailHog for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SEND_EMAIL=true

# Admin (seed user credentials)
ADMIN_EMAIL=admin@angebae.local
ADMIN_PASSWORD=admin123

# App
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
USE_LOCAL_DB=true
JWT_SECRET=your-super-secret-key-change-in-production

# PgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
```

**Full reference:** [.env.example](.env.example)

---

## 🐳 Docker Compose Services

### Running Individual Services

```bash
# Backend only
make backend

# OCR Worker only
make ocr-worker

# Database only
make postgres

# Redis only
make redis

# MinIO only
make minio

# MailHog only
make mailhog
```

### View Logs

```bash
# All services
make logs

# Specific service
make backend-logs
make ocr-logs
make db-logs
```

### Database Access

```bash
# PostgreSQL CLI
make db-shell

# Redis CLI
make redis-cli

# Backend shell
make admin-shell

# OCR Worker shell
make ocr-shell
```

---

## 📋 Database Migrations

Migrations run automatically on `docker-compose up`, but you can also run manually:

```bash
# Apply migrations manually
make migrate

# Or using docker-compose directly
docker-compose exec postgres psql -U angebae_user -d angebae_db -f /docker-entrypoint-initdb.d/001_init.sql
```

**Migration files location:** `db/migrations/`

---

## 👤 Admin User Setup

### Create/Update Admin

```bash
# With default credentials from .env
make seed-admin

# With custom credentials
docker-compose exec backend node scripts/seedAdmin.js your-email@example.com your-password
```

### Login

1. Navigate to `http://localhost:3000/admin/login`
2. Enter email and password
3. JWT token stored in `admin_auth` httpOnly cookie

---

## 🧠 OCR Worker Guide

### How It Works

1. **Enqueue**: POST `/api/ocr/enqueue` with media ID
2. **Worker receives**: Job added to Redis queue
3. **Processing**:
   - Download PDF from MinIO
   - Extract text using PDFDocument + OCR (Tesseract)
   - Parse text for product info (price, SKU, etc.)
   - Create confidence scores
4. **Results**: Store in `ocr_jobs` + `product_candidates` tables
5. **Polling**: GET `/api/ocr/jobs/:id` to check status

### Worker Logs

```bash
make ocr-logs

# See Celery worker activity
tail -f docker logs angebae_ocr_worker
```

### Environment (Docker Compose)

```dockerfile
ocr-worker:
  image: ocr-worker:latest
  environment:
    DATABASE_URL: postgresql://...
    REDIS_URL: redis://redis:6379
    MINIO_ENDPOINT: http://minio:9000
    CELERY_BROKER_URL: redis://redis:6379/0
    CELERY_RESULT_BACKEND: redis://redis:6379/1
```

**Worker code:** `workers/ocr/tasks.py`

---

## 📦 Backend Code Structure

```
app/
├── api/
│   ├── admin/
│   │   └── login/
│   │       └── route.ts          # Admin authentication
│   ├── media/
│   │   └── upload/
│   │       └── route.ts          # File upload to MinIO
│   ├── ocr/
│   │   ├── enqueue/
│   │   │   └── route.ts          # Enqueue OCR job
│   │   └── jobs/
│   │       └── [id]/route.ts     # Get OCR job status
│   ├── health/
│   │   └── route.ts              # Service health check
│   └── products/
│       └── route.ts              # Product CRUD (existing)
└── ...

lib/
├── db.ts                         # PostgreSQL client & utilities
├── minio.ts                      # MinIO file storage
├── jobs.ts                       # Redis job queue (BullMQ)
├── supabase/                     # Keep for backwards compat
└── ...

scripts/
├── seedAdmin.js                  # Admin user seeding
└── ...

workers/
└── ocr/
    ├── tasks.py                  # Celery OCR tasks
    ├── celery_config.py          # Celery configuration
    ├── requirements.txt          # Python dependencies
    └── Dockerfile                # Python container
```

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Check health
curl http://localhost:3000/api/health | jq

# 2. Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@angebae.local","password":"admin123"}'

# 3. Upload PDF
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@sample.pdf" \
  -F "type=pdf" \
  -b "admin_auth=your-token"

# 4. Enqueue OCR
curl -X POST http://localhost:3000/api/ocr/enqueue \
  -H "Content-Type: application/json" \
  -d '{"mediaId":"uuid"}' \
  -b "admin_auth=your-token"

# 5. Check status
curl http://localhost:3000/api/ocr/jobs/ocr-uuid
```

### Integration Test

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="admin login"
```

---

## 🛠️ Development Workflow

### Local Development (with Docker)

```bash
# 1. Start all services
make up

# 2. Tail logs
make logs

# 3. Make changes to code (Next.js auto-reloads)

# 4. Access Frontend: http://localhost:3000
# 5. Access Admin: http://localhost:3000/admin
# 6. Access API: http://localhost:3000/api/health
```

### Local Development (without Docker)

For running backend locally:

```bash
# 1. Install dependencies
npm install

# 2. Start Docker services only (no backend)
docker-compose up -d postgres redis minio mailhog

# 3. Run migrations
npm run migrate:local

# 4. Seed admin
npm run seed:admin

# 5. Start backend
npm run dev

# 6. In separate terminal, start OCR worker
cd workers/ocr
python -m celery -A tasks worker --loglevel=info
```

---

## 🚨 Troubleshooting

### Backend won't start

```bash
# Check logs
make backend-logs

# Verify database is ready
make health

# Restart backend
docker-compose restart backend
```

### OCR worker not processing jobs

```bash
# Check worker logs
make ocr-logs

# Verify Redis connection
docker-compose exec redis redis-cli ping

# Check queue status
docker-compose exec redis redis-cli LLEN ocr-jobs
```

### Database connection issues

```bash
# Check database is running
docker-compose ps | grep postgres

# Access database shell
make db-shell

# Check connection string
echo $DATABASE_URL
```

### MinIO issues

```bash
# Check MinIO logs
docker-compose logs minio

# Access MinIO console
# http://localhost:9001 (minioadmin/minioadmin)

# Check bucket exists
docker-compose exec minio mc ls local/angebae-media
```

---

## 📊 Monitoring

### Queue Status

```bash
# Connect to Redis CLI
make redis-cli

# View queue sizes
LLEN ocr-jobs
LLEN ocr-jobs:active
LLEN ocr-jobs:completed
```

### Database Stats

```bash
# Connect to database
make db-shell

-- Check tables size
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check admin users
SELECT id, email, active, created_at FROM admins;

-- Check OCR jobs
SELECT id, status, created_at, updated_at FROM ocr_jobs ORDER BY created_at DESC LIMIT 10;
```

---

## 📝 Notes

### Supabase Compatibility

This project **replaces Supabase** with self-hosted PostgreSQL. If you need to migrate:

1. **Auth**: Now uses `admins` table with bcrypt + PostgreSQL
2. **Database**: Direct PostgreSQL client (lib/db.ts)
3. **Middleware**: Still validates `admin_auth` cookie
4. **Server Actions**: Updated to use local DB

### Adding New Endpoints

Each API route should:

1. Check admin auth (from cookie)
2. Use `lib/db.ts` for queries
3. Return consistent JSON format
4. Include error handling
5. Log important operations

Example:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get("admin_auth")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Query DB
    const data = await query("SELECT * FROM products");
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Deploying to Production

Before production deployment:

1. Change `JWT_SECRET` to strong random value
2. Set `NODE_ENV=production`
3. Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
4. Use managed Redis (ElastiCache, Azure Cache, etc.)
5. Update MinIO to S3 or managed storage
6. Set up proper SSL certificates
7. Configure environment variables securely
8. Use CI/CD for deployments

---

## 🔗 Important Links

- **Frontend**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **MailHog**: http://localhost:8025
- **PgAdmin**: http://localhost:5050
- **API Health**: http://localhost:3000/api/health
- **Database**: postgres://localhost:5432
- **Redis**: localhost:6379

---

## 📄 License

This project is part of the Angebae platform.

## 🤝 Support

For issues or questions, check the logs:

```bash
# All logs
make logs

# Specific service
make backend-logs
make ocr-logs
make db-logs
```

---

**Last Updated**: February 17, 2024  
**Next.js Version**: 15.5.2  
**Node Version**: 18+  
**Python Version**: 3.11+
