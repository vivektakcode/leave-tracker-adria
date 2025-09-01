#!/bin/bash

# Leave Tracker - Branch Management Script
# This script helps manage the main and dev branches

set -e

echo "🌿 Leave Tracker - Branch Management"
echo "=================================="

case "$1" in
  "main")
    echo "Switching to main branch (production-ready)"
    git checkout main
    echo "✅ Main branch active - Email functionality working"
    echo "🌐 Deploy URL: leave-tracker-adria.vercel.app"
    ;;
  "dev")
    echo "Switching to dev branch (security features)"
    git checkout dev
    echo "🔒 Dev branch active - JWT auth, password hashing, etc."
    echo "🌐 Preview URL: dev.vercel.app (if configured)"
    ;;
  "status")
    echo "Current branch: $(git branch --show-current)"
    echo "Main branch: $(git log --oneline -1 origin/main)"
    echo "Dev branch: $(git log --oneline -1 origin/dev)"
    ;;
  "deploy-main")
    echo "Deploying main branch to production..."
    git checkout main
    git pull origin main
    git push origin main
    echo "✅ Main branch deployed to Vercel"
    ;;
  "deploy-dev")
    echo "Deploying dev branch to preview..."
    git checkout dev
    git pull origin dev
    git push origin dev
    echo "✅ Dev branch deployed to Vercel preview"
    ;;
  "merge-to-main")
    echo "⚠️  Merging dev security features to main..."
    echo "This will update production with security features"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout main
      git merge dev
      git push origin main
      echo "✅ Security features merged to main and deployed"
    else
      echo "❌ Merge cancelled"
    fi
    ;;
  *)
    echo "Usage: $0 {main|dev|status|deploy-main|deploy-dev|merge-to-main}"
    echo ""
    echo "Commands:"
    echo "  main         - Switch to main branch (production)"
    echo "  dev          - Switch to main branch (development)"
    echo "  status       - Show current branch status"
    echo "  deploy-main  - Deploy main branch to production"
    echo "  deploy-dev   - Deploy dev branch to preview"
    echo "  merge-to-main- Merge dev security features to main"
    echo ""
    echo "Current branch: $(git branch --show-current)"
    ;;
esac
