import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";

const Announcements = () => {
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [deadline, setDeadline] = useState("");

  // Data State
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSubjects();
    fetchAnnouncements();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects/teacher/${user._id}`);
      setSubjects(res.data || []);
    } catch (e) {
      console.log("Error fetching subjects", e);
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/announcements/teacher", {
        params: { userId: user._id },
      });
      setAnnouncements(res.data || []);
    } catch (e) {
      console.log("Error fetching announcements", e);
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatusMsg({ type: "error", text: "Title and message are required." });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        isImportant,
        subjectId: subjectId === "" ? undefined : subjectId,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        userId: user._id,
      };

      await api.post("/announcements", payload);

      // Reset
      setTitle("");
      setMessage("");
      setIsImportant(false);
      setSubjectId("");
      setDeadline("");
      
      setStatusMsg({ type: "success", text: "Announcement posted successfully!" });
      fetchAnnouncements();
    } catch (e) {
      setStatusMsg({ type: "error", text: "Failed to post announcement." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await api.delete(`/announcements/${id}`, {
        params: { userId: user._id },
      });
      fetchAnnouncements();
      setStatusMsg({ type: "success", text: "Announcement deleted." });
    } catch (e) {
      setStatusMsg({ type: "error", text: "Failed to delete announcement." });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Announcements</h1>
        <p className="text-gray-500 mt-2 font-medium">Broadcast important updates and deadlines to your students.</p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl text-sm font-bold border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          <span className="text-lg">{statusMsg.type === "success" ? "✓" : "⚠"}</span>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Post Form */}
        <div className="lg:col-span-1 border border-gray-100 bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Create Post</h2>
          </div>
          <form onSubmit={handlePost} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab Manual Submission"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</label>
              <textarea 
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of the announcement..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject (Optional)</label>
              <select 
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900 appearance-none"
              >
                <option value="">General (All Subjects)</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.subjectName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline (Optional)</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsImportant(!isImportant)}
              className={`w-full py-2.5 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                isImportant 
                  ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm" 
                  : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              }`}
            >
              <span className="text-lg">{isImportant ? "★" : "☆"}</span>
              {isImportant ? "Marked as Important" : "Mark as Important"}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        </div>

        {/* List of Announcements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">History</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              {announcements.length} Posts
            </span>
          </div>

          {loading ? (
             <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((item) => (
                <AnnouncementCard 
                  key={item._id} 
                  data={item} 
                  onDelete={() => handleDelete(item._id)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({ data, onDelete }) => {
  const dDate = new Date(data.createdAt);
  const dateStr = dDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = dDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
      data.isImportant 
        ? "bg-amber-50/50 border-amber-100 shadow-sm" 
        : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md"
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {data.title}
            </h4>
            {data.isImportant && (
              <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-tighter">
                Important
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>{dateStr} at {timeStr}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-indigo-500">{data.subject?.subjectName || "General Announcement"}</span>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Delete Announcement"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <p className="text-gray-600 text-[15px] font-medium leading-relaxed whitespace-pre-wrap ml-1">
        {data.message}
      </p>

      {data.deadline && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl">
          <span className="text-red-500 font-bold text-[11px] uppercase tracking-widest">Deadline:</span>
          <span className="text-red-700 font-bold text-xs">
            {new Date(data.deadline).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default Announcements;
