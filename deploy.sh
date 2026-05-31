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

# Detect if backend/package.json changed in this commit
BACKEND_PKG_CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "backend/package.json" || true)

echo ""
echo "🚀 [3/3] Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push u bë! Tani ekzekuto në SERVER:"
echo ""
echo "  cd ~/rent-car-tirana"
echo "  git pull origin main"
echo "  rm -rf backend/public/* backend/public/.htaccess"
echo "  cp -r dist/* backend/public/"
echo "  cp dist/.htaccess backend/public/.htaccess 2>/dev/null || true"

if [ "$BACKEND_PKG_CHANGED" -gt "0" ]; then
  echo ""
  echo "  ⚠️  backend/package.json ndryshoi — duhet npm install:"
  echo "  cd backend && npm install --production"
  echo "  cd .."
fi

echo "  pm2 restart all"
echo ""
