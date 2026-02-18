# Backend Quick Reference Card

**Angebae Backend - Developer Cheat Sheet**

---

## 🚀 Start Everything

```bash
make up                  # Start all services
make fresh              # Clean restart
docker-compose ps       # Check status
make logs               # View all logs
```

---

## 🔐 Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/admin/login \
  -d '{"email":"admin@angebae.local","password":"admin123"}'

# Token format: JWT (store in admin_auth cookie)
# Expiry: 24 hours
# Required for: media upload, ocr enqueue, product admin ops
```

---

## 📁 File Upload

```bash
# Upload to MinIO via API
curl -X POST /api/media/upload \
  -F "file=@document.pdf" \
  -F "type=pdf" \
  -b "admin_auth=$TOKEN"

# Response includes:
# - id (media UUID)
# - minioKey (storage path)
# - url (API endpoint)

# Direct MinIO access:
# Console: http://localhost:9001
# Login: minioadmin/minioadmin
# Bucket: angebae-media
```

---

## 🧠 OCR Flow

```bash
# 1. Upload PDF
MEDIA_ID=$(curl -s -X POST /api/media/upload ... | jq -r '.media.id')

# 2. Enqueue for OCR
curl -X POST /api/ocr/enqueue \
  -d "{\"mediaId\":\"$MEDIA_ID\"}"

# 3. Poll status
curl /api/ocr/jobs/$OCR_JOB_ID

# Status progression: pending → processing → done/failed
# Worker: Python Celery with Tesseract
# Processing time: 10-30s per 3-page PDF
```

---

## 🗄️ Database Queries

```bash
# Access database
make db-shell

# Common queries
SELECT * FROM admins;
SELECT * FROM products ORDER BY created_at DESC;
SELECT * FROM ocr_jobs WHERE status = 'done';
SELECT * FROM product_candidates WHERE resolved = false;
SELECT COUNT(*) FROM media WHERE type = 'pdf';
```

---

## 🔴 Redis/Jobs

```bash
# Access Redis CLI
make redis-cli

# Queue operations
LLEN ocr-jobs           # Active jobs
LLEN ocr-jobs:delayed   # Delayed/retry
LRANGE ocr-jobs:completed 0 -1  # Completed jobs

# Clear queue (dev only)
FLUSHALL
```

---

## 📝 Create New API Endpoint

**Pattern** (`app/api/route.ts`):

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get("admin_auth")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Query database
    const data = await query("SELECT * FROM products");
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Insert and return
    const result = await insert("products", body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 🐍 OCR Task Example

**Pattern** (`workers/ocr/tasks.py`):

```python
from tasks import app

@app.task(bind=True)
def my_task(self, param1, param2):
    try:
        # Get database connection
        conn = self.get_db_connection()
        
        # Do work
        result = process_something()
        
        # Update database
        cursor = conn.cursor()
        cursor.execute("UPDATE table SET ... WHERE ...")
        conn.commit()
        
        return {"status": "done", "result": result}
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        raise
```

---

## 🔍 Environment Variables

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@host/db

# Storage (optional, defaults shown)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=angebae-media

# Auth
JWT_SECRET=your-secret-key

# Queue
REDIS_URL=redis://redis:6379

# Email
SMTP_HOST=mailhog
SMTP_PORT=1025

# Flags
NODE_ENV=development
USE_LOCAL_DB=true
SEND_EMAIL=true
```

---

## 📊 Database Tables Quick Lookup

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `admins` | id, email, password | Admin users |
| `products` | id, title, sku, category_id | Product catalog |
| `product_variants` | id, product_id, price, stock | Variants |
| `orders` | id, order_number, status | Orders |
| `order_items` | id, order_id, product_id | Order lines |
| `media` | id, type, minio_key, product_id | Files |
| `ocr_jobs` | id, source_media_id, status | OCR jobs |
| `product_candidates` | id, ocr_job_id, confidence | OCR results |

---

## 📈 Useful Endpoints

| Endpoint | Method | Public | Purpose |
|----------|--------|--------|---------|
| `/api/health` | GET | ✅ | Service status |
| `/api/admin/login` | POST | ✅ | Authentication |
| `/api/admin/logout` | POST | ✅ | Logout |
| `/api/media/upload` | POST | ❌ | Upload file |
| `/api/ocr/enqueue` | POST | ❌ | Start OCR |
| `/api/ocr/jobs/:id` | GET | ✅ | Check OCR status |
| `/api/products` | GET | ✅ | List products |
| `/api/orders` | POST | ✅ | Create order |

---

## 🐛 Debugging

```bash
# View backend logs in real-time
make backend-logs

# View OCR worker logs
make ocr-logs

# View database logs
make db-logs

# Full stack logs
make logs

# Check what's running
docker-compose ps

# Restart specific service
docker-compose restart backend
docker-compose restart ocr-worker

# Shell into container
docker-compose exec backend sh
docker-compose exec ocr-worker bash
```

---

## 🔑 Default Credentials

| Service | User | Password | URL |
|---------|------|----------|-----|
| Admin Login | admin@angebae.local | admin123 | http://3000/admin |
| MinIO Console | minioadmin | minioadmin | http://9001 |
| PgAdmin | admin@admin.com | admin | http://5050 |
| PostgreSQL | angebae_user | angebae_password | localhost:5432 |

---

## 📦 Common npm Scripts

```bash
npm run build            # Build Next.js
npm run dev             # Start dev server (with docker-compose)
npm run start           # Production server
npm run seed:admin      # Create admin
npm run migrate:local   # Run migrations (when not in docker)
```

---

## 🚨 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -i :3000` then kill process |
| Database connection refused | `make db-logs` then `docker-compose restart postgres` |
| OCR worker not processing | `make ocr-logs` + check Redis: `make redis-cli PING` |
| File upload fails | Check MinIO: `http://9001` + check permissions |
| JWT token invalid | Re-login, token expires after 24h |

---

## 🎯 Performance Tips

```bash
# Optimize database queries:
# - Use indexes (already set)
# - Use LIMIT for lists
# - Use JSONB queries for attributes

# Optimize file uploads:
# - Keep max size at 100MB
# - Pre-compress PDFs
# - Use presigned URLs for downloads

# Optimize OCR:
# - Batch process PDFs if possible
# - Use concurrency: 4 (in docker-compose.yml)
# - Monitor queue size: `make redis-cli LLEN ocr-jobs`
```

---

## 📚 Full Documentation

- **README.md** - Overview
- **BACKEND.md** - Comprehensive guide (use this most)
- **API_ENDPOINTS.md** - All endpoints reference
- **VALIDATION_CHECKLIST.md** - Test & verify
- **IMPLEMENTATION_SUMMARY.md** - What was built

---

**Quick Links:**
- Documentation: See `*.md` files in root
- Logs: `make logs` or `make backend-logs`
- Database: `make db-shell`
- Health: `curl localhost:3000/api/health`

---

**Last Updated**: February 17, 2024  
**Next.js**: 15.5.2 | **Node**: 18+ | **Python**: 3.11+
