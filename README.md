# 🔖 Smart Bookmark App

A production-ready bookmark manager built with **Next.js (App Router)** and **Supabase**.

This application allows users to authenticate using Google OAuth and manage private bookmarks with real-time updates across multiple tabs.

---

## 🚀 Live Demo

👉 **Live URL:**
[https://smart-bookmark-app-three-eta.vercel.app/](https://smart-bookmark-app-three-eta.vercel.app/)

👉 **GitHub Repository:**
[https://github.com/Azizul-11/smart-bookmark-app](https://github.com/Azizul-11/smart-bookmark-app)

---

## 🛠 Tech Stack

* **Next.js (App Router)**
* **TypeScript**
* **Supabase**

  * Authentication (Google OAuth)
  * PostgreSQL Database
  * Row Level Security (RLS)
  * Realtime (Postgres WAL streaming)
* **Tailwind CSS**
* **Vercel** (Deployment)

---

## ✅ Features

* 🔐 Google OAuth authentication (no email/password)
* ➕ Add bookmark (title + URL)
* 🔒 Private bookmarks per user (strict RLS enforcement)
* 🔄 Real-time updates across browser tabs
* ❌ Delete bookmarks with confirmation
* 🚫 Duplicate prevention using DB-level unique index
* 🌐 URL normalization before storage
* 🚀 Fully deployed production environment

---

# 🧠 Architecture Overview

---

## 1️⃣ Authentication

Authentication is handled using Supabase Google OAuth.

After login:

* Supabase stores the session securely in the browser.
* `AuthGuard` protects private routes.
* Unauthenticated users are redirected using `router.replace()` to prevent history stack issues.
* OAuth redirect URLs configured for both local and production environments.

---

## 2️⃣ Database Design

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamp with time zone default now()
);
```

### Index for Performance

```sql
create index bookmarks_user_id_idx on bookmarks(user_id);
```

### Duplicate Prevention

```sql
create unique index unique_user_url
on bookmarks(user_id, url);
```

This ensures:

* A user cannot store the same normalized URL twice.
* Data integrity is enforced at the database level (not frontend logic).

---

## 3️⃣ Row Level Security (RLS)

RLS is enabled to guarantee strict user-level data isolation.

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

This guarantees:

* Users can only access their own bookmarks.
* No client-side filtering required.
* Security is enforced at the database layer.

---

## 4️⃣ Realtime Implementation

Supabase Realtime streams changes directly from PostgreSQL WAL.

### Database Configuration

* Enabled `bookmarks` table in `supabase_realtime` publication.
* Set:

```sql
ALTER TABLE public.bookmarks REPLICA IDENTITY FULL;
```

### Why REPLICA IDENTITY FULL?

By default, PostgreSQL only sends primary keys for DELETE events.

Setting `REPLICA IDENTITY FULL` ensures full row data is streamed, allowing proper filtered realtime subscriptions.

---

### Client-Side Realtime Subscription

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

### Key Design Decisions

* Realtime filtered per `user_id` (no global sync).
* Refetch strategy instead of manual state mutation.
* Proper cleanup of subscriptions on unmount.
* Designed for correctness over complexity.

---

## 5️⃣ URL Normalization Strategy

Before storing a bookmark:

* Hostname is lowercased.
* URL hash (`#section`) is removed.
* Trailing slash normalized (non-root only).
* Query parameters preserved.

Example:

All of these normalize to the same value:

```
https://google.com
https://google.com/
https://GOOGLE.com
https://google.com/#section
```

This ensures unique constraints work reliably.

---

# 🔐 Security Considerations

* No service role key exposed in frontend.
* Only public anon key used.
* Strict RLS policies enforced.
* OAuth-only authentication reduces attack surface.
* Realtime subscription filtered per authenticated user.
* Database-level uniqueness constraint prevents data corruption.

---

# 🧪 Local Setup

### 1️⃣ Clone repository

```bash
git clone https://github.com/Azizul-11/smart-bookmark-app.git
cd smart-bookmark-app
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Run development server

```bash
npm run dev
```

---

# 🏗 Design Philosophy

This project prioritizes:

* Security first (RLS enforcement)
* Database-level integrity
* Real-time correctness
* Clean architecture separation
* Production-ready OAuth configuration
* Simplicity over over-engineering

State is lifted to page level.
Components remain clean and presentational.
Security is enforced at the database — not trusted to frontend logic.

---

# ⏱ Development Focus

Built as part of a 72-hour micro-challenge.

Primary focus areas:

* Correct RLS implementation
* Proper realtime configuration
* Production OAuth setup
* Database integrity
* Clean architecture

---

# 📌 Final Notes

This application demonstrates understanding of:

* Supabase Auth + RLS
* PostgreSQL indexing & constraints
* Realtime streaming
* OAuth production configuration
* Next.js App Router patterns
* Security-conscious frontend architecture

It is fully production deployed and tested.



**“Make it elite level.”**
