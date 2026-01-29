-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Customers Table
create table if not exists customers (
  id text primary key,
  name text not null,
  "regNo" text,
  type text,
  "ceoName" text,
  "bizType" text,
  "bizItem" text,
  "financeDept" text,
  "managerName" text,
  phone text,
  email text,
  "bankName" text,
  "accountNo" text,
  "accountHolder" text,
  "zipCode" text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects Table
create table if not exists projects (
  id text primary key,
  name text not null,
  "customerId" text references customers(id) on delete cascade,
  "startDate" text,
  "endDate" text,
  budget numeric,
  "deptName" text,
  "managerName" text,
  "managerPhone" text,
  notes text,
  status text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Contracts Table
create table if not exists contracts (
  id text primary key,
  name text not null,
  "projectId" text references projects(id) on delete cascade,
  "customerId" text references customers(id),
  category text, 
  type text, 
  amount numeric,
  "signedDate" text,
  "startDate" text,
  "endDate" text,
  "accumulatedPayment" numeric,
  balance numeric,
  "registeredBalance" numeric,
  status text, 
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments Table
create table if not exists payments (
  id text primary key,
  "contractId" text references contracts(id) on delete cascade,
  item text, 
  amount numeric,
  "scheduledDate" text,
  "invoiceDate" text,
  "completionDate" text,
  status text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table (Application Users)
create table if not exists app_users (
  id text primary key,
  password text, 
  name text,
  position text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - OPTIONAL: DISABLE FOR NOW FOR SIMPLICITY
-- Or allow anon access
alter table customers enable row level security;
create policy "Enable access to all users" on customers for all using (true);

alter table projects enable row level security;
create policy "Enable access to all users" on projects for all using (true);

alter table contracts enable row level security;
create policy "Enable access to all users" on contracts for all using (true);

alter table payments enable row level security;
create policy "Enable access to all users" on payments for all using (true);

alter table app_users enable row level security;
create policy "Enable access to all users" on app_users for all using (true);
