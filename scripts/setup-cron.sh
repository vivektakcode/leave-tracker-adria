#!/bin/bash

# Setup cron job for leave reminders
# This script sets up a cron job to run every 3 days at 9 AM

echo "🕐 Setting up leave reminder cron job..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create the cron job command
CRON_JOB="0 9 */3 * * cd $PROJECT_DIR && curl -X POST http://localhost:3000/api/cron/leave-reminders"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "leave-reminders"; then
    echo "✅ Cron job already exists"
    crontab -l | grep "leave-reminders"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully"
fi

echo ""
echo "📋 Current cron jobs:"
crontab -l

echo ""
echo "🔧 To manually test the cron job:"
echo "curl -X POST http://localhost:3000/api/cron/leave-reminders"

echo ""
echo "📝 To remove the cron job:"
echo "crontab -e"
echo "Then delete the line with 'leave-reminders'"

echo ""
echo "🌐 For production, you can use:"
echo "1. Vercel Cron Jobs (if using Vercel)"
echo "2. GitHub Actions (if using GitHub)"
echo "3. External cron services like cron-job.org"
echo "4. Server cron (if self-hosting)"
