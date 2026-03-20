import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { label: "Overall", value: "overall" },
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const SESSION_TYPES = ["Lecture", "Practical", "Extra Class"];
const SECTIONS = ["A", "B", "C", "D"];
const DURATIONS = [
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "20 minutes", value: 20 },
  { label: "30 minutes", value: 30 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const snapToSlot = () => {
  const now = new Date();
  const start = new Date(now);
  if (now.getMinutes() < 15) start.setMinutes(0);
  else if (now.getMinutes() < 45) start.setMinutes(30);
  else {
    start.setHours(now.getHours() + 1);
    start.setMinutes(0);
  }
  start.setSeconds(0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  const fmt = (d) =>
    `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

const formatTimer = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

const rateColor = (r) =>
  r >= 75 ? "#10B981" : r >= 50 ? "#F59E0B" : "#EF4444";

// ── Reusable Components ──────────────────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, accent = "#6366F1" }) => (
  <Card className="p-6 flex items-start gap-4 hover:shadow-md">
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
      style={{ background: accent + "15", color: accent }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-gray-900 tracking-tight truncate">
        {value ?? "—"}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
          {sub}
        </p>
      )}
    </div>
  </Card>
);

const ProgressBar = ({ value, color = "#6366F1" }) => (
  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${Math.min(value, 100)}%`, background: color }}
    />
  </div>
);

// ── Main Attendance Page ─────────────────────────────────────────────────────

const Attendance = () => {
  const { user, activeSubject } = useAuth();

  // ── Session form ──────────────────────────
  const [sessionForm, setSessionForm] = useState({
    type: "Lecture",
    section: "A",
    duration: 10,
    topic: "",
    period: snapToSlot(),
  });

  // ── Active session ────────────────────────
  const [sessionId, setSessionId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);

  // ── History / filters ─────────────────────
  const [filters, setFilters] = useState({
    month: "overall",
    studentId: "all",
    type: "all",
  });
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    rate: 0,
  });
  const [students, setStudents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Initialization ────────────────────────
  useEffect(() => {
    setSessionForm((prev) => ({ ...prev, period: snapToSlot() }));
    if (user) recoverActiveSession();
  }, [user]);

  const recoverActiveSession = async () => {
    try {
      const res = await api.get(`/attendance/active-teacher-session?teacherId=${user._id}`);
      const sess = res.data;
      if (sess) {
        setSessionId(sess._id);
        setSessionActive(true);
        
        // Calculate remaining time
        const createdAt = new Date(sess.createdAt).getTime();
        const now = new Date().getTime();
        const elapsedSec = Math.floor((now - createdAt) / 1000);
        const totalSec = sess.duration * 60;
        const remaining = Math.max(0, totalSec - elapsedSec);
        
        setTimer(remaining);
        setSessionForm({
          type: sess.sessionType,
          section: sess.section || "A",
          duration: sess.duration,
          topic: sess.topic,
          period: `${new Date(sess.lectureStart).getHours()}:${String(new Date(sess.lectureStart).getMinutes()).padStart(2, "0")} - ${new Date(sess.lectureEnd).getHours()}:${String(new Date(sess.lectureEnd).getMinutes()).padStart(2, "0")}`
        });
      }
    } catch (e) {
      console.error("recoverActiveSession:", e);
    }
  };

  // ── Timer Logic ───────────────────────────
  useEffect(() => {
    if (!sessionActive || timer <= 0) return;
    const id = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [sessionActive, timer]);

  // Auto-close when timer hits 0
  useEffect(() => {
    if (sessionActive && timer === 0) handleCloseSession();
  }, [timer, sessionActive]);

  // Re-fetch history when filters or active subject changes
  useEffect(() => {
    if (activeSubject) fetchHistory();
  }, [filters, activeSubject]);

  // ── API Calls ─────────────────────────────

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!activeSubject) return;

    try {
      // ── Step 1: Get total count of enrolled students ──────────────────────
      const historyRes = await api.get(`/attendance/history?subjectId=${activeSubject._id}`);
      const enrolledCount = historyRes.data.students?.length || 0;

      const [startTime, endTime] = sessionForm.period.split("-");
      const res = await api.post("/attendance/start", {
        subject: activeSubject._id,
        department: activeSubject.department._id,
        semester: activeSubject.semester,
        section: sessionForm.section,
        sessionType: sessionForm.type,
        lectureStart: (startTime || "").trim(),
        lectureEnd: (endTime || "").trim(),
        duration: sessionForm.duration,
        topic: sessionForm.topic,
        totalStudents: enrolledCount,
        user: user._id,
      });

      const sess = res.data.session;
      setSessionId(sess._id);
      setSessionActive(true);
      setTimer(sessionForm.duration * 60);
      alert(
        "Attendance session started! Students can now mark their presence.",
      );
    } catch (err) {
      console.error("Start session error:", err);
      alert(err.response?.data?.message || "Failed to start session.");
    }
  };

  const handleCloseSession = async () => {
    if (!sessionId) return;
    try {
      await api.put(`/attendance/close/${sessionId}`, { userId: user._id });
      setSessionActive(false);
      setSessionId(null);
      alert("Attendance session closed.");
      fetchHistory();
    } catch (err) {
      console.error("Close session error:", err);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!activeSubject) return;
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: activeSubject._id });
      if (filters.month !== "overall") params.append("month", filters.month);
      if (filters.studentId !== "all")
        params.append("studentId", filters.studentId);
      if (filters.type !== "all") params.append("type", filters.type);

      const res = await api.get(`/attendance/history?${params.toString()}`);
      console.log(res.data.history);
      setHistory(res.data.history || []);
      setSummary(
        res.data.summary || {
          totalClasses: 0,
          attended: 0,
          absent: 0,
          rate: 0,
        },
      );
      if (res.data.students && filters.studentId === "all") {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeSubject, filters]);

  if (!activeSubject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-indigo-100">
          📅
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          Attendance Tracking
        </h2>
        <p className="text-gray-500 max-w-sm mt-3 font-medium">
          Please select your active subject from the Profile page to manage
          attendance sessions and view records.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-200">
              Session Portal
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
            Attendance Manager
            {sessionActive && (
              <span className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black rounded-full border border-red-100 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" /> LIVE
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Managing records for {activeSubject.subjectName} (
            {activeSubject.subjectCode})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: SESSION MANAGEMENT */}
        <div className="lg:col-span-5 text-black">
          <Card className="p-8 sticky top-8">
            {!sessionActive ? (
              <form onSubmit={handleStartSession} className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">
                    Begin New Session
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Configure session parameters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Type
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm transition-all"
                      value={sessionForm.type}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, type: e.target.value })
                      }
                    >
                      {SESSION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Window
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm transition-all"
                      value={sessionForm.duration}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          duration: parseInt(e.target.value),
                        })
                      }
                    >
                      {DURATIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {sessionForm.type === "Practical" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Batch / Section
                    </label>
                    <div className="flex gap-2">
                      {SECTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setSessionForm({ ...sessionForm, section: s })
                          }
                          className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${
                            sessionForm.section === s
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          Batch {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Lecture Period
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm transition-all"
                    placeholder="e.g. 9:00 - 10:00"
                    value={sessionForm.period}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, period: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm transition-all"
                    placeholder="e.g. Database Normalization"
                    value={sessionForm.topic}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, topic: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <span className="text-lg">📡</span> Start Attendance Broadcast
                </button>
              </form>
            ) : (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">
                    Broadcast Active
                  </p>
                  <h2
                    className="text-6xl font-black text-gray-900 tracking-tighter tabular-nums"
                    style={{ color: timer < 60 ? "#EF4444" : "#111827" }}
                  >
                    {formatTimer(timer)}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase mt-4 tracking-widest">
                    Time Remaining
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Type
                    </span>
                    <span className="text-xs font-black text-gray-900 uppercase">
                      {sessionForm.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Period
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      {sessionForm.period}
                    </span>
                  </div>
                  {sessionForm.topic && (
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Topic
                      </span>
                      <span className="text-xs font-bold text-gray-500 truncate max-w-[150px]">
                        {sessionForm.topic}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCloseSession}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-lg">⏹</span> Terminate Session
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: HISTORY & ANALYTICS */}
        <div className="lg:col-span-7 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-2 gap-6">
            <StatCard
              icon="📚"
              label="Total Classes"
              value={summary.totalClasses}
              accent="#3B82F6"
            />
            <StatCard
              icon="📈"
              label="Attendance Rate"
              value={`${summary.rate}%`}
              accent={rateColor(summary.rate)}
            />
          </div>

          {/* HISTORY CARD */}
          <Card className="min-h-[500px] flex flex-col text-black">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Presence Records
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Live from subject logs
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={filters.month}
                  onChange={(e) =>
                    setFilters({ ...filters, month: e.target.value })
                  }
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <option value="all">Every Type</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PERFORMANCE BAR */}
            <div className="px-8 py-4 bg-gray-50/50 flex items-center gap-6 border-b border-gray-50">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5 px-0.5">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Average Presentation
                  </span>
                  <span className="text-[10px] font-black text-gray-900">
                    {summary.rate}%
                  </span>
                </div>
                <ProgressBar
                  value={summary.rate}
                  color={rateColor(summary.rate)}
                />
              </div>
              {students.length > 0 && (
                <select
                  className="pl-3 pr-8 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none"
                  value={filters.studentId}
                  onChange={(e) =>
                    setFilters({ ...filters, studentId: e.target.value })
                  }
                >
                  <option value="all">All Students</option>
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.roll})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-x-auto">
              {historyLoading ? (
                <div className="h-64 flex flex-col items-center justify-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Syncing Records...
                  </p>
                </div>
              ) : history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-gray-400 font-bold mb-1 italic">
                    No records found for the selected criteria.
                  </p>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                    Try adjusting filters or starting a session
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-left">
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Student Identity</th>
                      <th className="px-8 py-5 text-center">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map((record, i) => (
                      <tr
                        key={record._id}
                        className="hover:bg-indigo-50/20 transition-colors group"
                      >
                        <td className="px-8 py-4 whitespace-nowrap">
                          <span className="text-[11px] font-black text-gray-900">
                            {record.date}
                          </span>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                            {record.sessionType || "Lecture"}
                          </p>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                              {record.studentName.charAt(0)}
                            </div>
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                              {record.studentName}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              record.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-gray-50/30 border-t border-gray-50 text-center">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Showing {history.length} Entries • End of subject logs
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
