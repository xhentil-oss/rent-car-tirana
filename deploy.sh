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
# Detect if .htaccess changed (rare — requires Stop/Start në cPanel)
HTACCESS_CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -c "public/.htaccess" || true)

echo ""
echo "🚀 [3/3] Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push u bë! Tani ekzekuto në SERVER:"
echo ""
echo "  cd ~/rent-car-tirana"
echo "  git pull origin main"
echo ""
echo "  # Deploy ÇDO HERË te ~/public_html/ (LiteSpeed serves from there)"
echo "  rm -rf ~/public_html/assets"
echo "  rm -f ~/public_html/index.html ~/public_html/placeholder-car.svg ~/public_html/robots.txt"
echo "  cp -r dist/assets dist/index.html dist/placeholder-car.svg dist/robots.txt ~/public_html/"
echo ""
echo "  # NUK kopjojmë .htaccess automatikisht — i konfiguruar nga cPanel"
echo "  # me Passenger + cache rules. Nëse e ndryshon, duhet Stop/Start në cPanel."
echo ""
echo "  # Verifikim:"
echo "  grep -oE 'index-[A-Za-z0-9_-]+\\.js' ~/public_html/index.html"
echo "  curl -sSI https://rentcartiranaairport.com/ | grep -iE 'cache-control'"

if [ "$BACKEND_PKG_CHANGED" -gt "0" ]; then
  echo ""
  echo "  ⚠️  backend/package.json ndryshoi — Run NPM Install nga cPanel:"
  echo "  cPanel → Setup Node.js App → Edit → Run NPM Install"
fi

if [ "$HTACCESS_CHANGED" -gt "0" ]; then
  echo ""
  echo "  ⚠️  .htaccess ndryshoi — kërkohet ribashkim manual me Passenger config:"
  echo "  1. Kopjo .htaccess: cp dist/.htaccess ~/public_html/.htaccess"
  echo "  2. cPanel → Setup Node.js App → Stop → Start (rikthen Passenger directives)"
  echo "  3. Verifiko që .htaccess ka edhe Passenger edhe LSCache rules"
fi

echo ""
echo "  # Restart Node app pas çdo deploy:"
echo "  cPanel → Setup Node.js App → klik Restart"
echo ""
