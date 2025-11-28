-- DROP EXISTING TABLES (RESET DB)
drop table if exists payments cascade;
drop table if exists class_tags cascade;
drop table if exists classes cascade;
drop table if exists tags cascade;
drop table if exists students cascade;
drop table if exists profiles cascade;
drop table if exists reschedule_requests cascade;
drop table if exists notifications cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Profiles Table (Roles)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text check (role in ('teacher', 'student')) not null,
  name text not null,
  email text not null,
  phone text,
  bio text,
  subject text, -- New column for teachers
  avatar text,
  address text,
  city text,
  state text,
  zip_code text,
  hourly_rate numeric,
  enrollment_number text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Tags Table (Teacher specific)
create table tags (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Classes Table (Marketplace)
create table classes (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references profiles(id) on delete cascade not null,
  student_id uuid references profiles(id) on delete set null, -- Nullable: class can be open
  subject text not null,
  date date not null,
  time time not null,
  duration integer not null, -- in minutes
  value numeric not null,
  status text check (status in ('open', 'booked', 'completed', 'cancelled', 'rescheduled', 'pending_approval')) default 'open',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Class Tags Junction
create table class_tags (
  class_id uuid references classes(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (class_id, tag_id)
);

-- Create Payments Table
create table payments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references profiles(id) on delete cascade not null,
  teacher_id uuid references profiles(id) on delete cascade not null,
  class_id uuid references classes(id) on delete set null,
  amount numeric not null,
  status text check (status in ('paid', 'pending')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reschedule Requests Table
CREATE TABLE reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'reschedule')),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tags enable row level security;
alter table classes enable row level security;
alter table class_tags enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;

-- RLS Policies
-- Profiles
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Tags
create policy "Teachers can view their own tags" on tags
  for select using (auth.uid() = teacher_id);

create policy "Teachers can insert their own tags" on tags
  for insert with check (auth.uid() = teacher_id);

create policy "Teachers can update their own tags" on tags
  for update using (auth.uid() = teacher_id);

create policy "Teachers can delete their own tags" on tags
  for delete using (auth.uid() = teacher_id);

-- Classes
create policy "Everyone can view public open classes" on classes
  for select using (status = 'open' and student_id is null);

create policy "Students can view their targeted open classes" on classes
  for select using (status = 'open' and student_id = auth.uid());

create policy "Teachers can view their own classes" on classes
  for select using (auth.uid() = teacher_id);

create policy "Students can view their booked classes" on classes
  for select using (auth.uid() = student_id);

create policy "Teachers can insert classes" on classes
  for insert with check (
    auth.uid() = teacher_id 
    and exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
  );

create policy "Teachers can update their own classes" on classes
  for update using (auth.uid() = teacher_id);

create policy "Teachers can delete their own classes" on classes
  for delete using (auth.uid() = teacher_id);

create policy "Students can book open classes" on classes
  for update using (
    status = 'open' 
    and student_id is null
  )
  with check (
    status = 'booked'
    and student_id = auth.uid()
  );

create policy "Students can respond to invites" on classes
  for update using (
    auth.uid() = student_id
    and status = 'pending_approval'
  )
  with check (
    student_id is null or auth.uid() = student_id
  );

-- Class Tags
create policy "Viewable by everyone" on class_tags
  for select using (true);

create policy "Teachers can manage tags for their classes" on class_tags
  for all using (
    exists (
      select 1 from classes
      where classes.id = class_tags.class_id
      and classes.teacher_id = auth.uid()
    )
  );

-- Payments
create policy "Users can view their own payments" on payments
  for select using (auth.uid() = student_id or auth.uid() = teacher_id);

create policy "Teachers can insert payments" on payments
  for insert with check (auth.uid() = teacher_id);

create policy "Teachers can update payments" on payments
  for update using (auth.uid() = teacher_id);

create policy "Teachers can delete payments" on payments
  for delete using (auth.uid() = teacher_id);

-- Notifications Policies
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);

create policy "System can insert notifications" on notifications
  for insert with check (true); -- Ideally restricted, but for now allow inserts so triggers/functions work easily across users