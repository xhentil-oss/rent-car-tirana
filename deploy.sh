#!/bin/bash
# ──────────────────────────────────────────────────────────────
# deploy.sh — Build frontend + push to GitHub
# Usage: bash deploy.sh "commit message"
# ──────────────────────────────────────────────────────────────
set -e

MSG="${1:-chore: deploy update}"

echo ""
echo "🔨 [1/3] Building frontend..."
npm run build

echo ""
echo "📝 [2/3] Committing (dist + src)..."
git add -A
git commit -m "$MSG" || echo "  ℹ️  Nothing new to commit"

echo ""
echo "🚀 [3/3] Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push u bë! Tani ekzekuto në SERVER:"
echo ""
echo "  cd ~/rent-car-tirana"
echo "  git pull origin main"
echo "  rm -rf backend/public/*"
echo "  cp -r dist/* backend/public/"
echo "  cd backend && npm install --production && npm run migrate"
echo "  pm2 restart all"
