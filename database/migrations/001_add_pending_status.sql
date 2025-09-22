-- Migration to add 'pending' to booking_status enum
-- This script safely adds the 'pending' status to the existing booking_status enum

BEGIN;

-- Add 'pending' to the booking_status enum
ALTER TYPE public.booking_status ADD VALUE 'pending';

COMMIT;