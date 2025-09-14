-- Create users table to store user profiles and roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  google_refresh_token TEXT, -- Encrypted refresh token for Google Calendar API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Appointment',
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  google_event_id TEXT, -- Google Calendar event ID
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "users_select_own" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for appointments table
CREATE POLICY "appointments_select_own" ON public.appointments 
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "appointments_insert_buyer" ON public.appointments 
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "appointments_update_participants" ON public.appointments 
  FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "appointments_delete_participants" ON public.appointments 
  FOR DELETE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Allow buyers to view all sellers for booking
CREATE POLICY "users_select_sellers" ON public.users 
  FOR SELECT USING (role = 'seller');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_appointments_seller_id ON public.appointments(seller_id);
CREATE INDEX IF NOT EXISTS idx_appointments_buyer_id ON public.appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
