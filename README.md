# Angebae - E-commerce Platform

**Angebae** is a modern e-commerce platform built with Next.js, featuring a complete backend infrastructure for product management, order processing, and AI-powered OCR-based catalog extraction.

## 🎯 Project Overview

### Frontend
- **Framework**: Next.js 15 with React 19
- **UI Components**: Shadcn UI (Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: React Forms (react-hook-form + Zod)

### Backend Infrastructure
- **Database**: PostgreSQL 15 with advanced schema (UUID, JSONB, full-text search)
- **Storage**: MinIO (S3-compatible object storage)
- **Job Queue**: Redis + BullMQ (Node.js) / Celery (Python)
- **OCR Processing**: Python Tesseract + PyMuPDF
- **Email**: MailHog (development) / SMTP (production)
- **Authentication**: JWT + bcrypt + secure cookies

## ✨ Key Features

### Product Management
- ✅ Product CRUD with variants
- ✅ Category hierarchy
- ✅ Media uploads (images, PDFs, videos)
- ✅ Time-limited offers
- ✅ Full-text search with pg_trgm

### OCR & AI Processing
- ✅ PDF-to-Text extraction with Tesseract OCR
- ✅ Automatic product candidate generation
- ✅ Confidence scoring
- ✅ Markup review and approval workflow (endpoints only)

### Order Management
- ✅ Order creation with customer data (JSONB)
- ✅ Shopping cart
- ✅ Order items with variants
- ✅ Order status tracking
- ✅ Payment integration (MercadoPago)

### Admin Dashboard
- ✅ Secure login with JWT
- ✅ Product/category management
- ✅ Order processing
- ✅ OCR job monitoring
- ✅ Settings

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (v20.10+)
- Node.js 18+ (optional, for local development)

### Launch Services

```bash
# Clone repository
git clone <repository-url>
cd AngeBae

# Start all services with one command
make up

# Run migrations and seed admin user
make migrate
make seed-admin

# Check service health
make health
```

**Access the application:**

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Admin Dashboard | http://localhost:3000/admin | admin@angebae.local / admin123 |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| MailHog | http://localhost:8025 | - |
| PgAdmin | http://localhost:5050 | admin@admin.com / admin |

## 📚 Documentation

### Backend Documentation
Complete backend setup, API endpoints, database schema, and development guide:

→ **[BACKEND.md - Complete Backend Guide](./BACKEND.md)**

### Key Backend Files
- **Database**: `db/migrations/001_init.sql`
- **Config**: `.env.example` and `.env.local`
- **Docker**: `docker-compose.yml`, `Dockerfile`, `workers/ocr/Dockerfile`
- **Scripts**: `scripts/seedAdmin.js`, `Makefile`
- **API Routes**: `app/api/admin/*`, `app/api/media/*`, `app/api/ocr/*`, `app/api/health/*`
- **Client Libs**: `lib/db.ts`, `lib/minio.ts`, `lib/jobs.ts`

## 🏗️ Architecture

### Service Architecture

```
┌─────────────────────────────────┐
│   Next.js Frontend/Backend      │
│   (Port 3000)                   │
└──────────────┬──────────────────┘
               │
       ┌───────┼────────────────┬──────────┐
       │       │                │          │
       ↓       ↓                ↓          ↓
   PostgreSQL Redis         MinIO      MailHog
   (5432)     (6379)     (9000/9001)   (1025)
       │       │
       └───┬───┘
           ↓
    OCR Worker (Python)
   (Celery + Tesseract)
```

### Database Schema Highlights

**Key Tables:**
- `admins` - Admin users with bcrypt passwords
- `products` - Product catalog with JSONB attributes
- `product_variants` - Variants with pricing and stock
- `orders` - Orders with JSONB customer data
- `media` - Files with MinIO storage keys
- `ocr_jobs` - OCR processing status
- `product_candidates` - OCR results

Full schema: `db/migrations/001_init.sql`

## 📦 Installation & Development

### Using Docker Compose (Recommended)

```bash
# All services start with one command
make up

# View logs
make logs

# Stop services
make down

# Restart
make restart

# Fresh start (clean + rebuild)
make fresh
```

### Local Development (without Docker)

```bash
# Install Node dependencies
npm install

# Start supporting services (DB, Redis, etc.) in Docker
docker-compose up -d postgres redis minio mailhog

# Run migrations
npm run migrate:local

# Seed admin user
npm run seed:admin

# Start Next.js dev server
npm run dev

# In another terminal, start OCR worker (Python)
cd workers/ocr
pip install -r requirements.txt
celery -A tasks worker --loglevel=info
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Admin Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@angebae.local",
    "password": "admin123"
  }'
```

### Upload Media
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@document.pdf" \
  -F "type=pdf" \
  -b "admin_auth=your-jwt-token"
```

### Enqueue OCR Job
```bash
curl -X POST http://localhost:3000/api/ocr/enqueue \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "uuid"}' \
  -b "admin_auth=your-jwt-token"
```

See **[BACKEND.md](./BACKEND.md)** for comprehensive API documentation.

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and customize:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Admin
ADMIN_EMAIL=admin@angebae.local
ADMIN_PASSWORD=admin123

# JWT
JWT_SECRET=your-secret-key
```

Full reference: `.env.example`

## 🔨 Available Commands

```bash
# Service Management
make up              # Start all services
make down            # Stop all services
make restart         # Restart all services
make logs            # View all logs
make ps              # List running containers

# Database
make migrate         # Run migrations
make seed-admin      # Create/update admin user
make db-shell        # Access PostgreSQL CLI

# Development
make backend-logs    # View backend logs
make ocr-logs        # View OCR worker logs
make health          # Check service health

# Utilities
make clean           # Remove containers & volumes
make fresh           # Clean + rebuild everything
make build           # Rebuild containers
```

See `Makefile` for all available commands.

## 📖 API Documentation

### Authentication
- `POST /api/admin/login` - Admin login with JWT

### Media
- `POST /api/media/upload` - Upload files to MinIO
- `GET /api/media/:id` - Get media details (TODO)

### OCR Processing
- `POST /api/ocr/enqueue` - Enqueue PDF for OCR
- `GET /api/ocr/jobs/:id` - Get OCR job status & results

### Products
- `GET /api/products` - List products with filters
- `POST /api/products` - Create product (admin)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - List orders

### System
- `GET /api/health` - Health check (DB, Redis, MinIO)

**Full API docs**: See [BACKEND.md](./BACKEND.md)

## 🏭 OCR Worker

The OCR worker processes PDF files using Tesseract and PyMuPDF:

1. **Enqueue**: Send PDF to queue via `POST /api/ocr/enqueue`
2. **Process**: Worker extracts text and identifies products
3. **Results**: Stores in `ocr_jobs` + `product_candidates` tables
4. **Status**: Poll via `GET /api/ocr/jobs/:id`

**Worker code**: `workers/ocr/`

## 📊 Monitoring

### Service Health
```bash
make health
```

### Logs
```bash
# All services
make logs

# Backend only
make backend-logs

# OCR worker
make ocr-logs

# Database
make db-logs
```

### Database Shell
```bash
make db-shell

-- Check tables
\dt

-- List admins
SELECT * FROM admins;

-- Check OCR jobs
SELECT * FROM ocr_jobs ORDER BY created_at DESC;
```

### Redis CLI
```bash
make redis-cli

# Check queue size
LLEN ocr-jobs
LLEN ocr-jobs:active
```

## 🚀 Deployment

### Development
Uses Docker Compose with local PostgreSQL, Redis, MinIO, and MailHog.

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (AWS RDS, Azure Database, etc.)
- [ ] Use managed Redis (ElastiCache, Azure Cache, etc.)
- [ ] Upload to S3 or use managed object storage
- [ ] Configure SSL/TLS certificates
- [ ] Set up proper email service (SendGrid, AWS SES, etc.)
- [ ] Enable CORS for frontend domain
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring and logging

## 📝 Directory Structure

```
AngeBae/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── admin/login/          # Authentication
│   │   ├── media/upload/         # File uploads
│   │   ├── ocr/                  # OCR processing
│   │   ├── health/               # Health check
│   │   └── ...
│   ├── admin/                    # Admin pages
│   ├── components/               # React components
│   └── ...
├── lib/                          # Utilities
│   ├── db.ts                     # PostgreSQL client
│   ├── minio.ts                  # MinIO client
│   ├── jobs.ts                   # Job queue
│   └── ...
├── db/
│   └── migrations/               # SQL migrations
├── workers/
│   └── ocr/                      # Python OCR worker
│       ├── tasks.py              # Celery tasks
│       ├── requirements.txt      # Python dependencies
│       └── Dockerfile
├── scripts/                      # Utility scripts
│   └── seedAdmin.js             # Admin seeding
├── docker-compose.yml            # Services definition
├── Dockerfile                    # Next.js Docker build
├── Makefile                      # Commands
├── .env.example                  # Environment template
└── README.md                     # This file
```

## 🛠️ Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# View logs
make logs

# Try clean restart
make fresh
```

### Database connection error
```bash
# Verify database is running
docker-compose ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Access database
make db-shell
```

### OCR worker not processing
```bash
# Check worker logs
make ocr-logs

# Verify Redis is running
make redis-cli

# Check queue
LLEN ocr-jobs
```

**Need help?** Check [BACKEND.md - Troubleshooting](./BACKEND.md#-troubleshooting) section.

## 🔒 Security Notes

- Admin passwords are hashed with bcrypt (10 rounds)
- JWT tokens stored in secure httpOnly cookies
- Database passwords should be strong (change in production)
- MinIO credentials (change from defaults in production)
- API routes check admin authentication before processing

## 📄 License

This project is proprietary software for Angebae.

## 🤝 Contributing

When adding new backend features:

1. Create API route in `app/api/`
2. Add database queries using `lib/db.ts`
3. Add tests for new endpoints
4. Document in [BACKEND.md](./BACKEND.md)
5. Update this README if needed

## 📞 Support

- **Backend Issues**: Check [BACKEND.md](./BACKEND.md#-troubleshooting)
- **Database**: Access via `make db-shell`
- **Logs**: View with `make logs`
- **Health Status**: Check with `make health`

---

**Stack**: Next.js 15 • React 19 • PostgreSQL 15 • Redis 7 • Python 3.11 • Docker  
**Last Updated**: February 17, 2024
