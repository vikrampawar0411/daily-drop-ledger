#!/bin/bash

# Script to apply the vendor-customer connection cleanup migrations
# This removes automatic connections and allows only explicit connections

echo "🔧 Applying vendor-customer connection cleanup migrations..."
echo ""
echo "This will:"
echo "1. Remove automatic connection triggers"
echo "2. Clean up ALL existing vendor-customer connections"
echo ""
echo "⚠️  WARNING: All customers will need to reconnect to vendors manually"
echo ""
read -p "Do you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "📋 Migration SQL to run in Supabase Dashboard:"
echo "================================================================"
echo ""

# Show first migration
echo "-- MIGRATION 1: Remove auto-connection triggers"
cat supabase/migrations/20251208230601_remove_auto_vendor_customer_connections.sql

echo ""
echo "================================================================"
echo ""

# Show second migration
echo "-- MIGRATION 2: Cleanup existing connections"
cat supabase/migrations/20251208230602_cleanup_existing_auto_connections.sql

echo ""
echo "================================================================"
echo ""
echo "📝 Instructions:"
echo "1. Copy the SQL above"
echo "2. Go to: https://supabase.com/dashboard/project/ssaogbrpjvxvlxtdivah/sql/new"
echo "3. Paste and run the SQL"
echo "4. Verify the changes in your database"
echo ""
echo "✅ After applying, customers will need to explicitly connect to vendors"
