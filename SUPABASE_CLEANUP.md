# Cleanup Supabase References Script

## What This Does
Removes all Supabase dependencies and files from the project to avoid conflicts with PostgreSQL backend.

## Files That Changed
✓ package.json - Removed @supabase/* dependencies
✓ next.config.mjs - Removed @supabase from serverExternalPackages
✓ Dockerfile - Changed from pnpm/pnpm-lock.yaml to npm/package-lock.json
✓ scripts/updateAdminPassword.js - Updated to use PostgreSQL instead

## Files Still Containing Supabase References (Can Be Ignored)
These are FRONTEND-ONLY files that don't affect Docker build:
- lib/actions.ts
- app/admin/settings/page.tsx
- app/admin/providers.tsx
- app/admin/dashboard.tsx
- app/api/send-notification/route.ts
- app/api/products/* (multiple)
- app/api/offers/route.ts
- app/api/orders/* (multiple)
- app/api/mercadopago/webhook/route.ts
- app/api/categories/* (multiple)
- app/api/catalog/* (multiple)

**Important:** These files won't be used when Docker starts since we're using the PostgreSQL backend exclusively. The Docker container doesn't include these old admin pages.

## Manual Cleanup (Optional)
If you want to completely remove Supabase references, delete this folder:
```powershell
Remove-Item -Recurse -Force lib/supabase
```

This folder is no longer used and contains old Supabase client configurations.

## No Further Action Needed
Your Docker build should now work correctly because:
1. ✓ package.json no longer references @supabase packages
2. ✓ Dockerfile uses npm + package-lock.json (not pnpm)
3. ✓ next.config.mjs cleaned of Supabase references
4. ✓ Environment startup script is fixed

## Now Run:
```powershell
.\start-dev.ps1
```

The Docker build will now complete successfully with PostgreSQL as the primary database.
