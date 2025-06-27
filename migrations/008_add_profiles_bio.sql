-- Migration: 008_add_profiles_bio.sql
-- Add bio field to existing profiles table for artist descriptions

ALTER TABLE profiles ADD COLUMN bio TEXT;

-- Update the existing RLS policies if needed
-- (Existing policies should already cover bio field since they allow all columns)