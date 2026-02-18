# 🔖 Smart Bookmark App

A production-ready bookmark manager built with **Next.js (App Router)** and **Supabase**.

This application enables users to authenticate via Google OAuth and manage private bookmarks with strict database-level security and real-time synchronization across multiple browser tabs.

---

## 🚀 Live Demo

🌐 **Production URL**
[https://smart-bookmark-app-three-eta.vercel.app/](https://smart-bookmark-app-three-eta.vercel.app/)

📂 **GitHub Repository**
[https://github.com/Azizul-11/smart-bookmark-app](https://github.com/Azizul-11/smart-bookmark-app)

---

## 🛠 Tech Stack

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

## ✨ Core Features

* 🔐 Google OAuth authentication (no password storage)
* ➕ Add bookmarks (title + normalized URL)
* 🔒 Strict per-user data isolation via RLS
* 🔄 Real-time updates across multiple browser tabs
* ❌ Secure delete with confirmation
* 🚫 Database-level duplicate prevention
* 🌐 URL normalization for consistent uniqueness
* 🚀 Fully deployed production environment

---

# 🧠 System Architecture

---

## 1️⃣ Authentication Flow

Authentication is handled using Supabase Google OAuth.

After login:

* Supabase manages the session securely.
* `AuthGuard` protects private routes.
* Unauthenticated users are redirected using `router.replace()` to prevent back-navigation issues.
* OAuth redirect URLs are configured for both local and production environments.

### Security Model

* No custom authentication logic implemented.
* No service role key exposed in frontend.
* Identity is enforced at the database layer via Supabase.

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

* A user cannot store the same normalized URL twice.
* Data integrity is enforced at the database level.
* Frontend does not rely on manual duplicate checking.

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

### Result

* Users can only access their own data.
* No cross-user data exposure is possible.
* Security is enforced by PostgreSQL — not frontend filtering.

---

## 4️⃣ Realtime Implementation

Supabase Realtime streams changes directly from PostgreSQL WAL.

### Database Configuration

```sql
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
```

### Why This Was Necessary

By default, PostgreSQL only streams primary keys for DELETE events.
Setting `REPLICA IDENTITY FULL` ensures full row data is streamed, allowing proper realtime synchronization for deletions.

### Client Subscription

```ts
supabase
  .channel("bookmarks-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "bookmarks",
      filter: `user_id=eq.${user.id}`,
    },
    () => {
      fetchBookmarks();
    }
  )
  .subscribe();
```

### Design Decisions

* Realtime filtered by `user_id`
* Refetch strategy used for correctness
* Subscription cleanup implemented on unmount
* Prioritized reliability over complex optimistic state updates

---

## 5️⃣ URL Normalization Strategy

Before insertion:

* Hostname is lowercased
* Hash fragments removed
* Trailing slash normalized (non-root)
* Query parameters preserved

Example:

All of these normalize to the same value:

```
https://google.com
https://google.com/
https://GOOGLE.com
https://google.com/#section
```

This guarantees that database uniqueness constraints work reliably.

---

# 🧩 Challenges Faced & Solutions

---

## Realtime Delete Events Not Updating

**Issue:**
Insert events worked immediately, but delete events did not sync across tabs.

**Cause:**
PostgreSQL only streams primary key values for DELETE events by default.

**Solution:**

```sql
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
```

This ensured full row data was streamed, enabling proper realtime synchronization.

---

## Enforcing True User-Level Privacy

**Issue:**
Frontend filtering alone is not secure.

**Solution:**
Enabled Row Level Security with strict policies using:

```sql
auth.uid() = user_id
```

Security is enforced directly by PostgreSQL.

---

## Handling Duplicate URLs Correctly

**Issue:**
Different variations of the same URL could bypass uniqueness.

**Solution:**

* Normalized URLs before insertion.
* Added composite unique index on `(user_id, url)`.

This ensures database-driven integrity.

---

## OAuth Production Configuration

**Issue:**
Hardcoded localhost redirects break in production.

**Solution:**
Used dynamic redirect:

```ts
redirectTo: window.location.origin
```

Configured Supabase and Google OAuth for both environments.

---

# 🏗 Architectural Principles

This project emphasizes:

* Database-driven integrity
* Secure multi-user isolation
* Production-aware OAuth configuration
* Real-time correctness
* Clean separation of concerns
* Simplicity over over-engineering

### Component Responsibilities

* `AuthGuard` → Access control
* `page.tsx` → State + data logic
* `BookmarkForm` → Validation + normalization
* `BookmarkList` → Presentational rendering

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
* Secure frontend architecture using Next.js App Router

---

# 🔮 Future Improvements

* Edit bookmark functionality
* Pagination for larger datasets
* Optimistic UI updates
* Bookmark categorization
* Rate limiting on insert
* Activity logging

---

# 📌 Final Statement

This application is fully deployed, production-tested, and security-focused.

It reflects deliberate architectural decisions prioritizing correctness, security, and maintainability rather than surface-level feature completion.
