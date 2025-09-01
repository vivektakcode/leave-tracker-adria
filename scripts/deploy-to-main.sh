#!/bin/bash

# Deploy to Main Script
# This script merges staging to main for production deployment

set -e

echo "🚀 Deploying staging to main..."

# Check if we're on staging branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "staging" ]; then
    echo "❌ Error: You must be on staging branch to deploy to main"
    echo "Current branch: $current_branch"
    exit 1
fi

# Check if staging has uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes on staging"
    echo "Please commit your changes first"
    exit 1
fi

# Push staging to remote
echo "📤 Pushing staging branch..."
git push origin staging

# Switch to main and pull latest
echo "🔄 Switching to main branch..."
git checkout main
git pull origin main

# Merge staging into main
echo "🔀 Merging staging into main..."
git merge staging --no-ff -m "Deploy: Merge staging to main"

# Push main to remote (triggers production deployment)
echo "🚀 Pushing to main (production deployment)..."
git push origin main

# Switch back to staging
echo "🔄 Switching back to staging..."
git checkout staging

echo "✅ Successfully deployed to main!"
echo "🌐 Production deployment will be available shortly on Vercel"
