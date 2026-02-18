# 🔖 Smart Bookmark App

A production-ready bookmark manager built with **Next.js (App Router)** and **Supabase**.

This application enables users to authenticate via **Google OAuth** and manage **private bookmarks** with secure database-level enforcement and real-time synchronization across multiple browser tabs.

---

## 🚀 Live Demo

🌐 **Production URL**
[https://smart-bookmark-app-three-eta.vercel.app/](https://smart-bookmark-app-three-eta.vercel.app/)

📂 **GitHub Repository**
[https://github.com/Azizul-11/smart-bookmark-app](https://github.com/Azizul-11/smart-bookmark-app)

---

# 🛠 Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

### Backend (Supabase)

* Google OAuth Authentication
* PostgreSQL
* Row Level Security (RLS)
* Realtime (WAL-based streaming)

### Deployment

* Vercel

---

# ✨ Core Features

* 🔐 Google OAuth authentication (no password storage)
* ➕ Add bookmarks (title + normalized URL)
* 🔒 Strict per-user data isolation via RLS
* 🔄 Real-time updates across multiple browser tabs
* ❌ Secure delete with confirmation
* 🚫 Database-level duplicate prevention
* 🌐 URL normalization for consistent uniqueness
* 🚀 Fully production deployed with proper OAuth redirect configuration

---

# 🧠 System Architecture

## 1️⃣ Authentication Flow

* Google OAuth handled by Supabase
* Session stored client-side
* `AuthGuard` protects private routes
* Unauthorized users redirected using `router.replace()` (no back navigation issue)
* Production + local redirect URLs properly configured

Security model:

* No custom auth logic
* No service role key exposed
* Supabase enforces identity at database layer

---

## 2️⃣ Database Schema

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamp with time zone default now()
);
```

### Performance Index

```sql
create index bookmarks_user_id_idx on bookmarks(user_id);
```

### Uniqueness Constraint

```sql
create unique index unique_user_url
on bookmarks(user_id, url);
```

This ensures:

* A user cannot store the same normalized URL twice
* Integrity is enforced at the database level
* Frontend does not need to enforce uniqueness logic

---

## 3️⃣ Row Level Security (RLS)

RLS guarantees strict user isolation.

```sql
alter table bookmarks enable row level security;
```

Policies:

```sql
-- Select
using (auth.uid() = user_id)

-- Insert
with check (auth.uid() = user_id)

-- Delete
using (auth.uid() = user_id)
```

Result:

* Users can only access their own data
* No cross-user data exposure possible
* Security enforced by PostgreSQL, not frontend logic

---

## 4️⃣ Realtime Implementation

Supabase Realtime streams changes directly from PostgreSQL WAL.

### Database Configuration

```sql
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
```

Why this matters:

By default, PostgreSQL only sends primary keys for DELETE events.
Setting `REPLICA IDENTITY FULL` ensures full row data is streamed, enabling proper filtered realtime subscriptions.

---

### Client Subscription

```ts
supabase
  .channel("bookmarks-realtime")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "bookmarks",
    filter: `user_id=eq.${user.id}`,
  }, () => {
    fetchBookmarks();
  })
  .subscribe();
```

### Design Decisions

* Filtered by `user_id`
* Refetch strategy for correctness
* Cleanup on unmount
* Avoid manual optimistic mutation complexity

This prioritizes reliability over cleverness.

---

## 5️⃣ URL Normalization Strategy

Before insertion:

* Hostname lowercased
* Hash removed
* Trailing slash normalized (non-root)
* Query parameters preserved

Example:

All normalize to the same value:

```
https://google.com
https://google.com/
https://GOOGLE.com
https://google.com/#section
```

This guarantees database uniqueness works as intended.

---

# 🔐 Security Model

* No service role key exposed
* Only public anon key used
* Strict RLS enforcement
* OAuth-only authentication
* Realtime filtered per authenticated user
* Database-level uniqueness constraints

Security is enforced at the **database**, not trusted to the client.

---

# 🏗 Architectural Principles

This project emphasizes:

* Database-driven integrity
* Production-aware OAuth configuration
* Secure multi-user isolation
* Real-time correctness
* Clean component separation
* Simplicity over over-engineering

Components:

* `AuthGuard` handles access control
* Page component manages state
* `BookmarkList` is presentational
* `BookmarkForm` handles normalization + validation

---

# 🧪 Local Development

### Clone repository

```bash
git clone https://github.com/Azizul-11/smart-bookmark-app.git
cd smart-bookmark-app
```

### Install dependencies

```bash
npm install
```

### Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run development server

```bash
npm run dev
```

---

# 📊 What This Project Demonstrates

* Proper Supabase Auth integration
* Correct RLS implementation
* PostgreSQL indexing strategy
* Realtime WAL streaming configuration
* Production OAuth redirect handling
* Next.js App Router architecture
* Secure frontend practices

---

# 🧩 Future Improvements

* Edit bookmark functionality
* Pagination for large datasets
* Optimistic UI updates
* Bookmark categorization
* Rate limiting on insert
* Audit logging

---

# ⏱ Development Context

Built as part of a 72-hour micro-challenge.

Primary focus:

* Correctness
* Security
* Production readiness
* Architectural clarity

---

# 📌 Final Statement

This application is fully deployed, production tested, and security-aware.

It reflects deliberate architectural decisions rather than surface-level implementation.
