# Verification Checklist - Supabase Removal & Docker Fix

## Pre-Test Verification ✅

### Files Changed (Verify These Files Were Updated)
```
☑ package.json - Should NOT contain "@supabase"
  Run: Select-String "@supabase" package.json
  Expected: (no matches)

☑ Dockerfile - Should use "npm" not "pnpm"
  Run: Select-String "pnpm" Dockerfile
  Expected: (no matches)

☑ Dockerfile - Should reference "package-lock.json" not "pnpm-lock.yaml"
  Run: Select-String "package-lock.json" Dockerfile
  Expected: 2 matches (builder and runtime stage)

☑ next.config.mjs - Should NOT contain "supabase"
  Run: Select-String "@supabase" next.config.mjs
  Expected: (no matches)

☑ scripts/updateAdminPassword.js - Should use "pg" not "supabase-js"
  Run: Select-String "supabase|@supabase" scripts/updateAdminPassword.js
  Expected: (no matches)
```

### Files Present (Should Exist)
```
☑ package.json - Exists
☑ package-lock.json - Exists (created during npm install)
☑ Dockerfile - Exists
☑ docker-compose.yml - Exists
☑ start-dev.ps1 - Exists
☑ lib/db.ts - Exists (PostgreSQL client)
☑ lib/jobs.ts - Exists (Redis queue)
☑ lib/minio.ts - Exists (File storage)
```

## Step 1: Run Docker Build ✅

```powershell
# Navigate to project
Set-Location C:\Users\josva\Documents\JVNB\AngeBae

# Run the startup
.\start-dev.ps1
```

## Step 2: Monitor for Success Indicators ✅

### ✅ SHOULD SEE:
```
✓ Checking Docker installation...
✓ Docker daemon is running
✓ docker-compose available
✓ Successfully built angebae-backend
✓ Successfully built angebae-ocr-worker
✓ Migrations completed
✓ Admin user seeded
✓ Health check passed!
```

### ❌ SHOULD NOT SEE:
```
✗ pnpm: command not found
✗ pnpm-lock.yaml: not found
✗ @supabase/... not found
✗ Supabase connection error
✗ Cannot find module '@supabase
✗ ERROR loading @supabase
```

## Step 3: Test Services ✅

```powershell
# 1. Open browser to your app
http://localhost:3000

# 2. Test admin login
http://localhost:3000/admin
Email: admin@angebae.com
Password: Admin@123456

# 3. Check API health
Invoke-WebRequest http://localhost:3000/api/health

# 4. Open MinIO console  
http://localhost:9001
Username: minioadmin
Password: minioadmin
```

## Quick Check Commands

```powershell
# Verify all services running
docker-compose ps

# Check for Supabase references (should be NONE)
Select-String "@supabase" package.json

# View backend logs
docker-compose logs backend | Select-String -Pattern "Successfully|ERROR|failed|supabase"

# Health check API
Invoke-WebRequest -Uri http://localhost:3000/api/health | ConvertTo-Json
```

## Final Checklist

- [ ] Docker build completed WITHOUT pnpm-lock.yaml errors
- [ ] Both angebae-backend and angebae-ocr-worker images built successfully
- [ ] All services (postgres, redis, minio, backend, ocr-worker, etc.) are running
- [ ] Database migrations completed successfully
- [ ] Admin user seeded successfully
- [ ] Frontend loads at http://localhost:3000
- [ ] Admin panel accessible at http://localhost:3000/admin
- [ ] Login works with admin@angebae.com / Admin@123456
- [ ] Health check API returns all services healthy
- [ ] No @supabase errors in any logs
- [ ] No pnpm or package resolution errors

**If all items are checked: ✅ SUCCESS! Your app is ready!**
