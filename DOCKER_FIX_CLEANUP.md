# Docker Cleanup & Restart Commands

## Step 1: Stop Everything
```powershell
# Stop all containers
docker-compose down

# Wait a moment
Start-Sleep -Seconds 5
```

## Step 2: Clean Up Old Images
```powershell
# Remove old images
docker image rm angebae-backend angebae-ocr-worker -f

# Or clean everything
docker system prune -af
```

## Step 3: Start Fresh
```powershell
# Navigate to project
Set-Location C:\Users\josva\Documents\JVNB\AngeBae

# Run startup script
.\start-dev.ps1
```

---

## One-Command Solution (Copy & Paste)

```powershell
docker-compose down; Start-Sleep -Seconds 5; docker image rm angebae-backend angebae-ocr-worker -f; docker system prune -af; .\start-dev.ps1
```

---

## What Was Fixed ✅

The OCR worker was trying to install `tesseract-ocr` from Debian repos inside Docker, but it couldn't connect to the network.

**Solution:**
1. Removed `tesseract-ocr` from Dockerfile (not needed)
2. Removed `pytesseract` from requirements.txt
3. Updated `workers/ocr/tasks.py` to use PyMuPDF text extraction instead
4. Simplified Docker dependencies to just `build-essential`

**Result:** 
- No network calls to external repos ✅
- Uses PyMuPDF for PDF text extraction ✅
- Docker build should complete successfully ✅

---

## Expected Build Time

- **First run:** 10-15 minutes (downloading base images)
- **Subsequent runs:** 1-2 minutes

---

## Success Indicators

You'll know it's working when you see:
```
✓ Successfully built angebae-backend
✓ Successfully built angebae-ocr-worker
✓ Migrations completed
✓ Admin user seeded
✓ Health check passed!
```

---

Run the cleanup commands above, then you're ready to go! 🚀
