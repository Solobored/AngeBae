# ✓ Quick Start Guide - Run This First

## Status: Ready to Run ✓

Your Angebae development environment is **ready for testing**. All prerequisites are installed and verified.

---

## 🚀 Start Your App in ONE Command

```powershell
.\start-dev.ps1
```

That's it! The script will:
- ✓ Check all your system tools
- ✓ Start all 8 Docker services (PostgreSQL, Redis, MinIO, etc.)
- ✓ Set up your database
- ✓ Create your admin account
- ✓ Open your browser to the app
- ✓ Show you all running services

---

## ⏱ How Long Does It Take?

### First Time: **7-15 minutes**
- Downloading Docker images: 5-10 min
- Starting services: 2-5 min

### After That: **1-2 minutes**

---

## 🔓 Login Credentials

Once the app loads, use these to log in:

```
Email:    admin@angebae.com
Password: Admin@123456
```

---

## 🌐 Service URLs

Once the script shows "Development environment is ready!":

| Service | URL | Login |
|---------|-----|-------|
| **App** | http://localhost:3000 | N/A |
| **Admin Panel** | http://localhost:3000/admin | See above |
| **MinIO (File Storage)** | http://localhost:9001 | minioadmin / minioadmin |
| **PgAdmin (Database)** | http://localhost:5050 | admin@pgadmin.org / admin |
| **MailHog (Email Test)** | http://localhost:8025 | N/A |
| **Health Check** | http://localhost:3000/api/health | API |

---

## ⚠️ Troubleshooting If It Doesn't Start

### "Docker is not running"
1. Open **Docker Desktop** from your Start menu
2. Wait 30 seconds for it to start
3. Try again: `.\start-dev.ps1`

### "Permission denied" or script won't run
Run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

Then: `.\start-dev.ps1`

### Port is already in use
If you see "bind: address already in use":
```powershell
docker-compose down
.\start-dev.ps1
```

### Check what went wrong
```powershell
docker-compose logs -f backend
```

---

## 📋 What to Test After Starting

1. **Frontend loads**: Visit http://localhost:3000
2. **Login works**: Go to http://localhost:3000/admin, login
3. **API is healthy**: Visit http://localhost:3000/api/health
4. **Upload a file**: Try uploading a file in the admin
5. **Send email**: Check http://localhost:8025 for test emails

---

## 🛑 When You're Done for the Day

```powershell
docker-compose down
```

Or just close the PowerShell window - you can restart next time with `.\start-dev.ps1`

---

## 📚 More Documentation

- **Full Setup Guide**: See `WINDOWS_SETUP_GUIDE.md`
- **Test Results**: See `TEST_RESULTS.md`  
- **API Docs**: See `API_ENDPOINTS.md`
- **Architecture**: See `BACKEND.md`

---

## ✅ Everything Is Already Done

Your project includes:

- ✓ Complete PostgreSQL database with 11 tables
- ✓ MinIO file storage system
- ✓ Redis job queue for background tasks
- ✓ Python OCR worker for document processing
- ✓ Email system with MailHog
- ✓ Admin authentication system
- ✓ Health check endpoints
- ✓ All API routes configured
- ✓ Docker Compose setup for one-command startup
- ✓ Windows PowerShell helper script

---

## 🎯 Next Steps

1. **Run**: `.\start-dev.ps1`
2. **Wait**: ~10 minutes first time (it's downloading Docker images)
3. **Login**: admin@angebae.com / Admin@123456
4. **Test**: Try uploading files, queueing OCR jobs, etc.
5. **Providers**: (optional) `npm run migrate && npm run seed:provider` then hit `/api/providers/by-slug/angebae`
6. **Build**: Add your features on top of this backend!

---

**Platform:** Windows PowerShell  
**Created:** February 18, 2026  
**Status:** ✓ Ready to Use

Enjoy! 🚀
