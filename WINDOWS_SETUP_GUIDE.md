# Windows PowerShell Setup Guide for Angebae

## Quick Start

### Prerequisites
- **Windows 10/11** with PowerShell 5.0+
- **Docker Desktop** for Windows (v29+) ✓ Installed
- **Node.js** (v24.12.0+) ✓ Installed  
- **npm** (v11.6.2+) ✓ Installed
- **docker-compose** (v5.0+) ✓ Installed
- **pnpm** (v10.26.2+) ✓ Installed (optional, for local development)

All required tools are already installed on your system!

## Method 1: Using the PowerShell Helper Script (RECOMMENDED)

### Step 1: Allow PowerShell Scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Step 2: Run the Helper Script
```powershell
.\start-dev.ps1
```

**Features:**
- ✓ Verifies Docker installation
- ✓ Checks Docker daemon is running
- ✓ Validates docker-compose availability
- ✓ Starts all 8 services (PostgreSQL, Redis, MinIO, etc.)
- ✓ Waits for services to be ready
- ✓ Runs database migrations
- ✓ Seeds admin user
- ✓ Performs health checks
- ✓ Opens browser to services
- ✓ Streams live logs

### Step 3: Access Services

Once the script shows "Development environment is ready!", you can access:

```
Application:  http://localhost:3000
Admin Panel:  http://localhost:3000/admin
MinIO:        http://localhost:9001  (user: minioadmin, pass: minioadmin)
PgAdmin:      http://localhost:5050  (user: admin@pgadmin.org, pass: admin)
MailHog:      http://localhost:8025  (For testing email)
API Health:   http://localhost:3000/api/health
```

### Admin Credentials
```
Email:    admin@angebae.com
Password: Admin@123456
```

## Method 2: Using Direct Docker Commands

If you prefer manual control:

### Step 1: Start Services
```powershell
docker-compose up --build -d
```

### Step 2: Wait for Startup (30 seconds)
```powershell
Start-Sleep -Seconds 30
```

### Step 3: Check Status
```powershell
docker-compose ps
```

### Step 4: Run Migrations
```powershell
docker-compose exec -T backend node scripts/migrate.js
```

### Step 5: Seed Admin User
```powershell
docker-compose exec -T backend node scripts/seedAdmin.js
```

### Step 6: Check Health
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/health | ConvertTo-Json
```

### Step 7: View Logs
```powershell
docker-compose logs -f
```

## Method 3: Create a Custom PowerShell Function

Add this to your PowerShell profile for easy access:

```powershell
# Add to C:\Users\{username}\Documents\PowerShell\profile.ps1

function Start-AngebaeApp {
    param(
        [switch]$NoOpen,
        [switch]$LogOnly
    )
    
    Set-Location "C:\Users\josva\Documents\JVNB\AngeBae"
    
    if ($LogOnly) {
        & ".\start-dev.ps1" -NoOpen -LogOnly
    } elseif ($NoOpen) {
        & ".\start-dev.ps1" -NoOpen
    } else {
        & ".\start-dev.ps1"
    }
}

function Stop-AngebaeApp {
    docker-compose down
    Write-Host "✓ Services stopped"
}
```

Then you can simply run:
```powershell
Start-AngebaeApp              # Start with browser
Start-AngebaeApp -NoOpen      # Start without browser
Start-AngebaeApp -LogOnly     # Check services only
Stop-AngebaeApp               # Stop all services
```

## Troubleshooting

### Issue: "make: The term 'make' is not recognized"
**Solution:** You're on Windows. Use `.\start-dev.ps1` instead of `make up`.

### Issue: Docker daemon not running
**Solution:** Open Docker Desktop application. Services will auto-start once Docker is running.

### Issue: Port already in use
Example: `bind: address already in use`

**Solution:** Find and stop the conflicting service:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace {PID} with actual process ID)
taskkill /PID {PID} /F

# Or stop all Docker services
docker-compose down
```

### Issue: Permission denied on node_modules
**Solution:** 
```powershell
# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

### Issue: Services not starting
**Solution:** Check Docker logs:
```powershell
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Issue: Database migration failed
**Solution:**
```powershell
# Check PostgreSQL is running
docker-compose ps postgres

# Or manually run migration
docker-compose exec backend node scripts/migrate.js
```

## Dependency Installation

If you need to install npm dependencies locally:

```powershell
# Using npm
npm install --legacy-peer-deps

# Or using pnpm
pnpm install
```

**Note:** Docker services will work even without local node_modules installed, as they run Node.js inside the containers.

## Development Workflow

### Starting Fresh
```powershell
.\start-dev.ps1
```

### Stopping Services
```powershell
docker-compose down
```

### Viewing Logs
```powershell
docker-compose logs -f backend    # Backend logs
docker-compose logs -f postgres   # Database logs
docker-compose logs -f redis      # Cache logs
docker-compose logs -f ocr-worker # OCR worker logs
```

### Restarting Specific Service
```powershell
docker-compose restart backend
```

### Rebuilding Services
```powershell
docker-compose up --build
```

### Cleaning Everything
```powershell
docker-compose down -v
```

## Service Status Commands

```powershell
# List running services
docker-compose ps

# Get health status
Invoke-WebRequest -Uri http://localhost:3000/api/health | ConvertTo-Json

# Check database connection
docker-compose exec postgres psql -U admin -d angebae -c "SELECT 1"

# Check MinIO
Invoke-WebRequest -Uri http://localhost:9001

# Check Redis
docker-compose exec redis redis-cli ping
```

## Next Steps

1. ✓ Create `start-dev.ps1` helper script
2. ✓ Verify Docker, Node.js, npm, docker-compose installed
3. ✓ Review Windows-compatible commands
4. **→ Run `.\start-dev.ps1` to start all services**
5. Test API endpoints
6. Test authentication flow
7. Test media upload
8. Test OCR processing

## Script Features Summary

The `start-dev.ps1` script provides:

```
✓ Docker installation check
✓ Docker daemon verification
✓ docker-compose availability check
✓ Service startup with automatic rebuild
✓ 30-second wait for service readiness
✓ Container status display
✓ Database migration execution
✓ Admin user seeding
✓ Multi-service health checks
✓ Automatic browser opening
✓ Colored output for readability
✓ Live log streaming
```

---

**Last Updated:** February 18, 2026
**Platform:** Windows PowerShell
**Status:** Ready for testing ✓
