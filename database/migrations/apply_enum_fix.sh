#!/bin/bash

# Database Migration Script: Add 'pending' to booking_status enum
# 
# This script applies the database migration to add the missing 'pending' 
# enum value to the booking_status type in the Supabase database.
#
# Usage:
#   1. Open Supabase SQL Editor
#   2. Run the SQL command below
#   3. Or use this script with psql if you have direct database access

echo "To fix the booking status enum error, run this SQL in your Supabase SQL Editor:"
echo
echo "-- Migration: Add 'pending' to booking_status enum"
echo "ALTER TYPE public.booking_status ADD VALUE 'pending';"
echo
echo "This will add the missing 'pending' status that the application expects."
echo "After running this, the booking API should work correctly."