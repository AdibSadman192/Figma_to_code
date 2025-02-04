-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type project_status as enum ('pending', 'processing', 'completed', 'failed');

-- Create users table (extends Supabase auth.users)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade,
    email text,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (id)
);

-- Create projects table to store Figma design projects
create table if not exists public.projects (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    figma_file_key text not null,
    figma_file_name text,
    figma_file_url text,
    status project_status default 'pending',
    settings jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create generated_code table to store the output
create table if not exists public.generated_code (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    html_content text,
    css_content text,
    assets jsonb default '[]'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create RLS policies
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.generated_code enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Projects policies
create policy "Users can view their own projects"
    on public.projects for select
    using (auth.uid() = user_id);

create policy "Users can create their own projects"
    on public.projects for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own projects"
    on public.projects for update
    using (auth.uid() = user_id);

create policy "Users can delete their own projects"
    on public.projects for delete
    using (auth.uid() = user_id);

-- Generated code policies
create policy "Users can view their own generated code"
    on public.generated_code for select
    using (
        auth.uid() = (
            select user_id 
            from public.projects 
            where id = generated_code.project_id
        )
    );

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Triggers
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
