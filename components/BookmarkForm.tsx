"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BookmarkForm({
  onBookmarkAdded,
}: {
  onBookmarkAdded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizeUrl = (rawUrl: string) => {
    const parsed = new URL(rawUrl.trim());

    // Normalize hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove hash
    parsed.hash = "";

    let normalized = parsed.toString();

    // Remove trailing slash (except root "/")
    if (
      normalized.endsWith("/") &&
      parsed.pathname !== "/"
    ) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setErrorMessage("Title and URL are required.");
      return;
    }

    let normalizedUrl: string;

    try {
      normalizedUrl = normalizeUrl(trimmedUrl);
    } catch {
      setErrorMessage("Invalid URL.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage("User not authenticated.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({
      title: trimmedTitle,
      url: normalizedUrl,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("Bookmark already exists.");
      } else {
        console.error("Insert error:", error);
        setErrorMessage("Something went wrong.");
      }
    } else {
      setTitle("");
      setUrl("");
      onBookmarkAdded();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Bookmark title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border rounded"
      />

      {errorMessage && (
        <p className="text-red-500 text-sm">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Bookmark"}
      </button>
    </form>
  );
}
