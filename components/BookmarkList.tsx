"use client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  created_at: string;
};

export default function BookmarkList({
  bookmarks,
  onDelete,
}: {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No bookmarks yet. Add your first one.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="p-4 border rounded flex justify-between items-center"
        >
          <div>
            <h2 className="font-semibold">{bookmark.title}</h2>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm"
            >
              {bookmark.url}
            </a>
          </div>

          <button
  onClick={() => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this bookmark?"
    );

    if (confirmed) {
      onDelete(bookmark.id);
    }
  }}
  className="px-3 py-1 bg-red-500 text-white rounded text-sm"
>
  Delete
</button>

        </div>
      ))}
    </div>
  );
}
