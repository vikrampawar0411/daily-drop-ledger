#!/bin/bash

# Apply migration for created_from_subscription_id field
# This adds the field to the orders table to track which subscription created each order

echo "Applying migration: add_created_from_subscription_id_to_orders"

npx supabase db execute --file supabase/migrations/20251219110139_add_created_from_subscription_id_to_orders.sql

echo "Migration applied successfully!"
