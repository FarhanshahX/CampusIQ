import { useEffect, useState } from "react";
import api from "../../api/axios";

// ─── helpers ──────────────────────────────────────────────────────────────────
const adminId = () => localStorage.getItem("userID");

const SEM_LABEL = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// ─── small reusable bits ──────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent = "#3B5BDB" }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
    <div
      className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
      style={{ background: accent + "18", color: accent }}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? "—"}</p>
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
  </div>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({ dept, onClose, onSaved }) => {
  const [form, setForm] = useState({
    departmentName: dept.departmentName || "",
    academicBatch: dept.academicBatch || "",
    collegeName: dept.collegeName || "",
    degreeType: dept.degreeType || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    try {
      await api.patch(`/admin/department/${adminId()}/edit`, form);
      onSaved(form);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Department</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {[
          { key: "collegeName", label: "College Name" },
          { key: "degreeType", label: "Degree Type" },
          { key: "academicBatch", label: "Academic Batch (e.g. 2023-2027)" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {label}
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Department Name
          </label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.departmentName}
            onChange={(e) =>
              setForm({ ...form, departmentName: e.target.value })
            }
          >
            {[
              "Artificial Intelligence & Data Science",
              "Artificial Intelligence & Machine Learning",
              "Computer Science Engineering",
              "Internet of Things",
              "Electrical Engineering",
              "Mechanical Engineering",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        {err && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {err}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Department = () => {
  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [incrementing, setIncrementing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subjectTeachers, setSubjectTeachers] = useState({});
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchDept();
  }, []);

  const fetchDept = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/department/${adminId()}`);
      setDept(res.data);
      // Fetch teachers for subjects
      await fetchSubjectTeachers(res.data.subjects || []);
      await fetchteachers(res.data._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchteachers = async (deptId) => {
    const res = await api.get(`/admin/department/teacher/${deptId}`);
    setTeachers(res.data);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dept.shortCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchSubjectTeachers = async (subjects) => {
    const teachers = {};
    for (const sub of subjects) {
      if (sub.assignedTeacher) {
        try {
          const res = await api.get(`/admin/teacher/${sub._id}`);
          teachers[sub._id] = res.data;
        } catch (e) {
          console.error("Failed to fetch teacher for subject", sub._id, e);
        }
      }
    }
    setSubjectTeachers(teachers);
  };

  const handleIncrement = async () => {
    if (
      !window.confirm(
        `Advance department to Semester ${(dept.semester || 1) + 1}? This cannot be undone.`,
      )
    )
      return;
    setIncrementing(true);
    try {
      const res = await api.patch(
        `/admin/department/${adminId()}/increment-semester`,
      );
      setDept((prev) => ({
        ...prev,
        semester: res.data.semester,
        departmentYear: res.data.departmentYear,
      }));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to increment semester.");
    } finally {
      setIncrementing(false);
    }
  };

  const handleEditSaved = (form) => {
    setDept((prev) => ({ ...prev, ...form }));
    setShowEdit(false);
  };

  // ── Loading / empty states ─────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading department…
      </div>
    );

  if (!dept)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No department found.
      </div>
    );

  const semLabel = SEM_LABEL[dept.semester] || dept.semester;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Department</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {dept.departmentName} · {dept.collegeName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dept code pill */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-xs text-blue-500 font-semibold uppercase tracking-wider">
              Code
            </span>
            <span className="text-sm font-bold text-blue-800 tracking-widest">
              {dept.shortCode}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            ✏️ Edit
          </button>

          <button
            onClick={handleIncrement}
            disabled={incrementing || dept.semester >= 8}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {incrementing
              ? "Advancing…"
              : `↑ Advance to Sem ${(dept.semester || 1) + 1}`}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="📅"
          label="Current Semester"
          value={`Sem ${semLabel}`}
        />
        <StatCard
          icon="🎓"
          label="Year"
          value={`Year ${dept.departmentYear}`}
          accent="#0EA5E9"
        />
        <StatCard
          icon="👨‍🏫"
          label="Teachers"
          value={teachers?.length ?? 0}
          accent="#10B981"
        />
        <StatCard
          icon="📚"
          label="Subjects"
          value={dept.subjects?.length ?? 0}
          accent="#F59E0B"
        />
      </div>

      {/* ── Department Info Card ── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Department Details
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
          <Field label="College" value={dept.collegeName} />
          <Field label="Degree" value={dept.degreeType} />
          <Field label="Department" value={dept.departmentName} />
          <Field label="Academic Batch" value={dept.academicBatch} />
          <Field
            label="Semester"
            value={`Semester ${dept.semester} (${semLabel})`}
          />
          <Field label="Year" value={`Year ${dept.departmentYear}`} />
        </div>
      </div>

      {/* ── Subjects & Teachers Table ── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Subjects &amp; Teachers
          </h2>
        </div>

        {dept.subjects?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-semibold">Subject</th>
                  <th className="px-6 py-3 text-left font-semibold">Code</th>
                  <th className="px-6 py-3 text-left font-semibold">Sem</th>
                  <th className="px-6 py-3 text-left font-semibold">Teacher</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dept.subjects.map((sub, i) => (
                  <tr
                    key={sub._id || i}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {sub.subjectName}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {sub.subjectCode}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{sub.semester}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {subjectTeachers[sub._id] ? (
                        `${subjectTeachers[sub._id].firstName ?? ""} ${subjectTeachers[sub._id].lastName ?? ""}`.trim()
                      ) : (
                        <span className="text-gray-400 italic">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {subjectTeachers[sub._id]?.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            No subjects added yet.
          </div>
        )}
      </div>

      {/* ── Teachers Card ── */}
      {teachers?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Teachers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-semibold">Name</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Designation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((t, i) => (
                  <tr key={t._id || i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {t.firstName} {t.lastName}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{t.employeeId}</td>
                    <td className="px-6 py-3 text-gray-500">{t.email}</td>
                    <td className="px-6 py-3 text-gray-500">{t.designation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <EditModal
          dept={dept}
          onClose={() => setShowEdit(false)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

export default Department;
