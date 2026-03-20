import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/useAuth";
import api, { API_BASE_URL } from "../../api/axios";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FILE_ICONS = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  ppt: "📊",
  pptx: "📊",
  xls: "📋",
  xlsx: "📋",
  zip: "🗜️",
  mp4: "🎬",
  mp3: "🎵",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

const getFileIcon = (filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] || "📎";
};

const getFileExt = (filename = "") =>
  filename.split(".").pop()?.toUpperCase() || "FILE";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Reusable Components ──────────────────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

// ── Resource Card ────────────────────────────────────────────────────────────

const ResourceCard = ({ item, onDelete }) => {
  const fileUrl = item.fileUrl ? `${API_BASE_URL}${item.fileUrl}` : "#";
  const displayName =
    item.fileName || (item.fileUrl ? item.fileUrl.split("/").pop() : "") || "";

  return (
    <Card className="p-5 flex items-center gap-5 group">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0 transition-transform group-hover:scale-110 duration-300">
        {getFileIcon(displayName)}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-black text-gray-900 truncate tracking-tight">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-indigo-600 rounded-md border border-gray-100 uppercase tracking-widest">
            {getFileExt(displayName)}
          </span>
          {item.fileSize && (
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {formatSize(item.fileSize)}
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            • {formatDate(item.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:text-indigo-600 transition-all text-gray-400 group/btn"
          title="Download/View"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover/btn:-translate-y-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </a>
        <button
          onClick={() => onDelete(item._id)}
          className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:text-red-600 transition-all text-gray-400 group/btn"
          title="Delete"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </Card>
  );
};

// ── Main Resources Page ──────────────────────────────────────────────────────

const Resources = () => {
  const { user, activeSubject } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [file, setFile] = useState(null);

  const fetchResources = useCallback(async () => {
    if (!activeSubject) return;
    setLoading(true);
    try {
      const res = await api.get(`/resources/subject/${activeSubject._id}`);
      setResources(res.data || []);
    } catch (err) {
      console.error("Fetch resources error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeSubject]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this resource? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/resources/${id}`);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert("Failed to delete resource. Please try again.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !file) {
      alert("Please provide a title and select a file.");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("subjectId", activeSubject._id);
    data.append("teacherId", user._id);
    data.append("file", file);

    setUploading(true);
    try {
      await api.post("/resources/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsModalOpen(false);
      setFormData({ title: "", description: "" });
      setFile(null);
      fetchResources();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!activeSubject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-indigo-100">
          📂
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Access Resources
        </h2>
        <p className="text-gray-500 max-w-sm mt-3 font-medium">
          Please select your active subject from the Profile page to manage
          shared study materials.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-200">
              Study Materials
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            Subject Resources
            <span className="text-gray-300 ml-3 font-medium">
              {activeSubject.subjectCode}
            </span>
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Manage and share files with your students for{" "}
            {activeSubject.subjectName}.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-3"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Upload Resource
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Retrieving Files...
          </p>
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-[2.5rem] py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">
            📂
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            No resources yet
          </h3>
          <p className="text-gray-500 font-medium mt-2">
            Shared documents and study materials will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((item) => (
            <ResourceCard key={item._id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !uploading && setIsModalOpen(false)}
        title="Upload Student Resource"
      >
        <form onSubmit={handleUpload} className="space-y-6 text-black">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
              placeholder="e.g. Unit 2 Study Guide"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Description
            </label>
            <textarea
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
              placeholder="What is this resource about? (Optional)"
              rows="3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              File *
            </label>
            <div className="relative group">
              <input
                type="file"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div
                className={`px-5 py-8 border-2 border-dashed rounded-2xl text-center transition-all ${
                  file
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-gray-50 group-hover:border-indigo-300"
                }`}
              >
                <div className="text-3xl mb-2">
                  {file ? getFileIcon(file.name) : "☁️"}
                </div>
                <p
                  className={`text-sm font-black tracking-tight ${file ? "text-indigo-900" : "text-gray-400"}`}
                >
                  {file ? file.name : "Click to select or drag and drop"}
                </p>
                {file && (
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">
                    {formatSize(file.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
              uploading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5"
            }`}
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Publish Resource"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Resources;
