# start-dev.ps1 - Development Environment Setup Script
# This script starts all Docker services and prepares the environment for development

param(
    [switch]$NoOpen,  # Skip opening browser windows
    [switch]$LogOnly   # Only show logs, don't start services
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Angebae Development Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to print steps
function Print-Step {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -ForegroundColor Gray -NoNewline
    Write-Host $message -ForegroundColor Green
}

# Function to print errors
function Print-Error {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -ForegroundColor Gray -NoNewline
    Write-Host $message -ForegroundColor Red
}

# Function to print info
function Print-Info {
    param([string]$message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] " -ForegroundColor Gray -NoNewline
    Write-Host $message -ForegroundColor Cyan
}

# Check if Docker is installed
Print-Step "Checking Docker installation..."
try {
    $dockerVersion = docker --version 2>$null
    Print-Step "✓ Docker installed: $dockerVersion"
} catch {
    Print-Error "✗ Docker is not installed or not in PATH"
    Print-Error "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
}

# Check if Docker daemon is running
Print-Step "Checking Docker daemon..."
try {
    docker ps $null 2>&1
    Print-Step "✓ Docker daemon is running"
} catch {
    Print-Error "✗ Docker daemon is not running"
    Print-Error "Please start Docker Desktop"
    exit 1
}

# Check if docker-compose is available
Print-Step "Checking docker-compose..."
try {
    $composeVersion = docker-compose --version 2>$null
    Print-Step "✓ docker-compose available: $composeVersion"
} catch {
    Print-Error "✗ docker-compose is not available"
    exit 1
}

Print-Info "All prerequisites verified!"
Write-Host ""

# Start services if not just viewing logs
if (-not $LogOnly) {
    Print-Step "Starting Docker services..."
    Print-Info "Building and starting containers... (this may take a few minutes on first run)"
    Write-Host ""
    
    try {
        docker-compose up --build -d
        if ($LASTEXITCODE -ne 0) {
            Print-Error "Failed to start services"
            exit 1
        }
        Print-Step "✓ Docker services started"
    } catch {
        Print-Error "✗ Failed to start Docker services"
        exit 1
    }

    Write-Host ""
    Print-Step "Waiting for services to be ready... (30 seconds)"
    $progress = 0
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        $progress = [math]::Min($i + 1, 30)
        $bar = "[" + ("=" * ($progress / 2)) + ("-" * (15 - $progress / 2)) + "] $progress/30s"
        Write-Host "`r$bar" -NoNewline
    }
    Write-Host "`n"

    # Check container status
    Print-Step "Checking container status..."
    $containers = docker-compose ps --format "table {{.Service}}\t{{.Status}}"
    Write-Host $containers
    Write-Host ""

    # Run migrations
    Print-Step "Running database migrations..."
    try {
        docker-compose exec -T backend node scripts/migrate.js
        if ($LASTEXITCODE -eq 0) {
            Print-Step "✓ Migrations completed"
        } else {
            Print-Error "⚠ Migrations may have had issues (check logs)"
        }
    } catch {
        Print-Error "⚠ Could not run migrations immediately (services may still be starting)"
    }

    Write-Host ""

    # Seed admin user
    Print-Step "Seeding admin user..."
    try {
        docker-compose exec -T backend node scripts/seedAdmin.js
        if ($LASTEXITCODE -eq 0) {
            Print-Step "✓ Admin user seeded"
            Write-Host "   Email: admin@angebae.com"
            Write-Host "   Password: Admin@123456"
        } else {
            Print-Error "⚠ Admin seeding may have had issues"
        }
    } catch {
        Print-Error "⚠ Could not seed admin user immediately"
    }

    Write-Host ""

    # Health check
    Print-Step "Performing health check..."
    Start-Sleep -Seconds 3
    
    $healthOk = $false
    for ($i = 0; $i -lt 5; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $health = $response.Content | ConvertFrom-Json
                Print-Step "✓ Health check passed!"
                Write-Host ""
                Write-Host "Service Status:" -ForegroundColor Yellow
                Write-Host "  Database: $($health.services.database)"
                Write-Host "  Storage: $($health.services.storage)"
                Write-Host "  Queue: $($health.services.queue)"
                $healthOk = $true
                break
            }
        } catch {
            if ($i -lt 4) {
                Print-Info "Health check attempt $($i + 1)/5 - retrying in 3 seconds..."
                Start-Sleep -Seconds 3
            }
        }
    }

    if (-not $healthOk) {
        Print-Error "⚠ Health check failed or timeout - services may still be starting"
    }

    Write-Host ""
    Print-Step "✓ Development environment is ready!"
    Write-Host ""
    Write-Host "Available Services:" -ForegroundColor Yellow
    Write-Host "  Application:  http://localhost:3000"
    Write-Host "  Admin Panel:  http://localhost:3000/admin"
    Write-Host "  MinIO:        http://localhost:9001  (Access/Secret: minioadmin)"
    Write-Host "  PgAdmin:      http://localhost:5050  (admin@pgadmin.org / admin)"
    Write-Host "  MailHog:      http://localhost:8025  (Email testing)"
    Write-Host "  API Health:   http://localhost:3000/api/health"
    Write-Host ""
    Write-Host "Admin Credentials:" -ForegroundColor Yellow
    Write-Host "  Email:    admin@angebae.com"
    Write-Host "  Password: Admin@123456"
    Write-Host ""
}

# Open browser windows if not disabled
if (-not $NoOpen) {
    Print-Step "Opening services in browser..."
    Write-Host ""
    
    try {
        Start-Process "http://localhost:3000"
        Print-Step "✓ Opened application"
        Start-Sleep -Seconds 1
    } catch {
        Print-Info "Could not open application (browser may not be available)"
    }
}

# Show logs
Print-Step "Streaming service logs (Press Ctrl+C to stop)..."
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

try {
    docker-compose logs -f
} catch {
    Print-Info "Logs stopped"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Print-Info "Development environment stopped"
