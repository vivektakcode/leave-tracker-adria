#!/bin/bash

# Script to apply database indexes for performance optimization
# Run this script in your Supabase SQL editor or via psql

echo "🚀 Applying database indexes for performance optimization..."

# Check if we're in the right directory
if [ ! -f "scripts/create_performance_indexes.sql" ]; then
    echo "❌ Error: create_performance_indexes.sql not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 Available options:"
echo "1. Copy SQL to clipboard (for Supabase SQL editor)"
echo "2. Display SQL content"
echo "3. Exit"

read -p "Choose an option (1-3): " choice

case $choice in
    1)
        if command -v pbcopy &> /dev/null; then
            cat scripts/create_performance_indexes.sql | pbcopy
            echo "✅ SQL copied to clipboard! Paste it into your Supabase SQL editor."
        elif command -v xclip &> /dev/null; then
            cat scripts/create_performance_indexes.sql | xclip -selection clipboard
            echo "✅ SQL copied to clipboard! Paste it into your Supabase SQL editor."
        else
            echo "❌ Clipboard not available. Please copy the SQL manually."
            cat scripts/create_performance_indexes.sql
        fi
        ;;
    2)
        echo "📄 SQL Content:"
        echo "=================="
        cat scripts/create_performance_indexes.sql
        ;;
    3)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📝 Instructions:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Paste the SQL content"
echo "4. Click 'Run' to apply the indexes"
echo ""
echo "⚡ After applying indexes, your app will be lightning fast!"
