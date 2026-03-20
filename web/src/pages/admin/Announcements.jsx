import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

// ─── helpers ──────────────────────────────────────────────────────────────────
const adminId = () => localStorage.getItem("userID");

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Announcement Card ────────────────────────────────────────────────────────
const AnnouncementCard = ({ item, onDelete }) => {
  const isImportant = item.isImportant;
  return (
    <div
      className={`bg-white border rounded-xl p-5 space-y-2 shadow-sm transition ${
        isImportant ? "border-amber-300 border-l-4" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900">{item.title}</p>
          {isImportant && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 uppercase tracking-wide">
              ★ Important
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(item._id)}
          className="text-xs text-red-400 hover:text-red-600 font-semibold shrink-0 cursor-pointer"
        >
          Delete
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {fmtDate(item.createdAt)}
        {item.teacher
          ? ` · By ${item.teacher.firstName} ${item.teacher.lastName}`
          : " · Admin"}
        {item.subject ? ` · ${item.subject.subjectName}` : " · General"}
      </p>

      <p className="text-sm text-gray-700 leading-relaxed">{item.message}</p>

      {item.deadline && (
        <span className="inline-block text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded px-2 py-1">
          Deadline: {fmtDate(item.deadline)}
        </span>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Announcements = () => {
  // form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [deadline, setDeadline] = useState("");

  // data
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "important"

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch everything (admin can see all)
      const res = await api.get("/announcements/student");
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error("Error fetching announcements", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePost = async () => {
    if (!title.trim() || !message.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/announcements", {
        title: title.trim(),
        message: message.trim(),
        isImportant,
        deadline: deadline || undefined,
        userId: adminId(),
      });
      setTitle("");
      setMessage("");
      setIsImportant(false);
      setDeadline("");
      fetchAnnouncements();
    } catch (e) {
      setFormError(
        e?.response?.data?.message || "Failed to post announcement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`, {
        params: { userId: adminId() },
      });
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      alert("Could not delete announcement.");
    }
  };

  const filtered =
    filter === "important"
      ? announcements.filter((a) => a.isImportant)
      : announcements;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Broadcast messages to all teachers and students
        </p>
      </div>

      {/* ── Compose Card ── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Post New Announcement
        </h2>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Midterm Exam Schedule"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Write your announcement…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Footer row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Important toggle */}
          <button
            onClick={() => setIsImportant(!isImportant)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition cursor-pointer ${
              isImportant
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {isImportant ? "★ Marked Important" : "☆ Mark Important"}
          </button>

          {/* Deadline */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-medium">
              Deadline:
            </label>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            {deadline && (
              <button
                onClick={() => setDeadline("")}
                className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handlePost}
            disabled={submitting}
            className="ml-auto px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Posting…" : "Post Announcement"}
          </button>
        </div>

        {formError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
            {formError}
          </p>
        )}
      </div>

      {/* ── Past Announcements ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            All Announcements{" "}
            <span className="text-gray-400 font-normal">
              ({filtered.length})
            </span>
          </h2>

          {/* Filter tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 text-xs font-medium gap-1">
            {["all", "important"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md transition capitalize cursor-pointer ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f === "important" ? "★ Important" : "All"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Loading announcements…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl py-12 text-center text-gray-400 text-sm shadow-sm">
            {filter === "important"
              ? "No important announcements."
              : "No announcements posted yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <AnnouncementCard
                key={item._id}
                item={item}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;

// const Announcements = () => {
//   return (
//     <div>
//       hii
//       <h1>This is working</h1>
//     </div>
//   );
// };

// export default Announcements;
