.PHONY: help up down restart logs migrate seed-admin ps health build clean fresh

# Default target
help:
	@echo "Angebae Backend - Available Commands:"
	@echo ""
	@echo "  make up                Build and start all services"
	@echo "  make down              Stop all services"
	@echo "  make restart           Restart all services"
	@echo "  make logs              View all service logs (follow mode)"
	@echo ""
	@echo "  make migrate           Run database migrations"
	@echo "  make seed-admin        Create/update admin user"
	@echo "  make health            Check health of all services"
	@echo ""
	@echo "  make backend-logs      View backend logs"
	@echo "  make ocr-logs          View OCR worker logs"
	@echo "  make db-logs           View database logs"
	@echo ""
	@echo "  make ps                List running containers"
	@echo "  make build             Build all containers"
	@echo "  make clean             Stop services and remove volumes"
	@echo "  make fresh             Clean and rebuild everything"
	@echo ""
	@echo "Services:"
	@echo "  - Frontend:        http://localhost:3000"
	@echo "  - Backend API:     http://localhost:3000/api"
	@echo "  - MinIO Console:   http://localhost:9001"
	@echo "  - MailHog Web:     http://localhost:8025"
	@echo "  - PgAdmin:         http://localhost:5050"

up:
	@echo "🚀 Starting all services..."
	docker-compose up --build -d
	@echo "✅ All services started!"
	@echo ""
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@make health

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

migrate:
	@echo "🗄️  Running database migrations..."
	docker-compose exec postgres psql -U ${POSTGRES_USER:-angebae_user} -d ${POSTGRES_DB:-angebae_db} -f /docker-entrypoint-initdb.d/001_init.sql
	@echo "✅ Migrations complete!"

seed-admin:
	@echo "👤 Seeding admin user..."
	docker-compose exec backend node scripts/seedAdmin.js
	@echo "✅ Admin user created/updated!"

health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3000/api/health | jq . || echo "Backend not ready yet"

backend: 
	docker-compose compose up -d backend

ocr-worker:
	docker-compose up -d ocr-worker

redis:
	docker-compose up -d redis

postgres:
	docker-compose up -d postgres

minio:
	docker-compose up -d minio

mailhog:
	docker-compose up -d mailhog

backend-logs:
	docker-compose logs -f backend

ocr-logs:
	docker-compose logs -f ocr-worker

db-logs:
	docker-compose logs -f postgres

ps:
	docker-compose ps

build:
	docker-compose build --no-cache

clean:
	@echo "🧹 Removing containers and volumes..."
	docker-compose down -v
	@echo "✅ Cleanup complete!"

fresh: clean build up migrate seed-admin

install-deps:
	@echo "📦 Installing Node dependencies..."
	npm install
	@echo "✅ Dependencies installed!"

dev: up
	docker-compose logs -f backend

# Admin and development helpers
admin-shell:
	docker-compose exec backend sh

db-shell:
	docker-compose exec postgres psql -U ${POSTGRES_USER:-angebae_user} -d ${POSTGRES_DB:-angebae_db}

redis-cli:
	docker-compose exec redis redis-cli

ocr-shell:
	docker-compose exec ocr-worker sh
