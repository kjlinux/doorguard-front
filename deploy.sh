#!/bin/bash
# ============================================================
# DoorGuard Frontend - Script de deploiement VPS (Hestia Panel)
# Usage: ssh user@vps "bash /path/to/deploy.sh"
# ============================================================

set -e

APP_DIR="/home/Nycaise/web/doorguard.tangagroup.com/public_html"

echo "========================================"
echo " DoorGuard Frontend - Deploiement"
echo "========================================"

cd "$APP_DIR"

# 1. Pull des derniers changements
echo ""
echo "[1/4] Git pull..."
git pull origin main

# 2. Installer les dependances
echo ""
echo "[2/4] pnpm install..."
pnpm install --frozen-lockfile

# 3. Build (les NEXT_PUBLIC_* sont lus depuis .env.production)
echo ""
echo "[3/4] Build Next.js..."
pnpm build

# 4. Redemarrer PM2
echo ""
echo "[4/4] Restart PM2..."
pm2 restart doorguard-front

echo ""
echo "========================================"
echo " Deploiement frontend termine !"
echo "========================================"
