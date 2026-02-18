"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import { supabase } from "@/lib/supabaseClient";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

 const fetchBookmarks = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error);
  }

  if (data) {
    setBookmarks(data);
  }

  setLoading(false);
};

useEffect(() => {
  let channel: ReturnType<typeof supabase.channel>;

  const setupRealtime = async () => {
    // Initial fetch
    await fetchBookmarks();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    channel = supabase
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
  };

  setupRealtime();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, []);




  const handleDelete = async (id: string) => {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
  } else {
    fetchBookmarks();
  }
};

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto mt-10 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>

        <BookmarkForm onBookmarkAdded={fetchBookmarks} />

        {loading ? (
          <p className="text-center">Loading bookmarks...</p>
        ) : (
          <BookmarkList
  bookmarks={bookmarks}
  onDelete={handleDelete}
/>
        )}
      </div>
    </AuthGuard>
  );
}
