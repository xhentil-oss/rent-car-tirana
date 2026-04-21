#!/bin/bash
# ──────────────────────────────────────────────────────────────
# deploy.sh — Build frontend + push to GitHub
# Usage: bash deploy.sh "commit message"
# ──────────────────────────────────────────────────────────────
set -e

MSG="${1:-chore: deploy update}"

echo ""
echo "🔨 [1/4] Building frontend..."
npm run build

echo ""
echo "📦 [2/4] Copying dist → backend/public..."
rm -rf backend/public
cp -r dist backend/public

echo ""
echo "📝 [3/4] Committing..."
git add -A
git commit -m "$MSG" || echo "  ℹ️  Nothing new to commit"

echo ""
echo "🚀 [4/4] Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push u bë me sukses!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Hapat në SERVER (cPanel SSH):"
echo ""
echo "  cd ~/public_html          # ose folder-i i projektit"
echo "  git pull origin main"
echo "  cd backend"
echo "  npm install --production"
echo "  npm run migrate"
echo "  pm2 restart rental-backend   # ose emri i procesit tuaj"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
