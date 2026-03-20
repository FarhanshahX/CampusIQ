// import React, { useState, useEffect, useMemo } from "react";
// import { useAuth } from "../../auth/useAuth";
// import api from "../../api/axios";

// const ScoresEntering = () => {
//   const { user, activeSubject } = useAuth();
//   const [students, setStudents] = useState([]);
//   const [selectedStudent, setSelectedStudent] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [scoresFetching, setScoresFetching] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [isMarksLocked, setIsMarksLocked] = useState(false);
//   const [lockToggling, setLockToggling] = useState(false);

//   // Mark states
//   const [internal, setInternal] = useState(Array(6).fill(""));
//   const [experiments, setExperiments] = useState(Array(10).fill(""));
//   const [assignments, setAssignments] = useState(Array(2).fill(""));
//   const [attendance, setAttendance] = useState("");
//   const [practical, setPractical] = useState("");
//   const [theory, setTheory] = useState("");
//   const [message, setMessage] = useState({ type: "", text: "" });

//   const currentSubjectType = activeSubject?.subjectType || "";

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   useEffect(() => {
//     if (!selectedStudent || !activeSubject) {
//       resetFields();
//       return;
//     }
//     resetFields();
//     fetchStudentData(selectedStudent, activeSubject._id);
//     fetchMarkLockStatus(activeSubject._id);
//   }, [selectedStudent, activeSubject]);

//   const fetchStudents = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/admin/students");
//       setStudents(res.data);
//     } catch (error) {
//       console.error("Error fetching students", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchMarkLockStatus = async (subjectId) => {
//     try {
//       const res = await api.get(`/scores/lock/status/${subjectId}`);
//       setIsMarksLocked(res.data?.isLocked || false);
//     } catch (_) {
//       setIsMarksLocked(false);
//     }
//   };

//   const fetchStudentData = async (studentId, subjectId) => {
//     setScoresFetching(true);
//     try {
//       // Fetch saved marks
//       const marksRes = await api.get(`/scores/${studentId}/${subjectId}`);
//       const marks = marksRes.data?.marks;

//       if (marks) {
//         if (marks.internalTests)
//           setInternal(
//             marks.internalTests.map((v) => (v === null ? "" : String(v))),
//           );
//         if (marks.experiments)
//           setExperiments(
//             marks.experiments.map((v) => (v === null ? "" : String(v))),
//           );
//         if (marks.assignments)
//           setAssignments(
//             marks.assignments.map((v) => (v === null ? "" : String(v))),
//           );
//         if (marks.practicalOral != null)
//           setPractical(String(marks.practicalOral));
//         if (marks.theory != null) setTheory(String(marks.theory));
//         if (marks.attendanceScore != null)
//           setAttendance(String(marks.attendanceScore));
//       }

//       // Fetch live attendance as override
//       const subjectName = activeSubject?.subjectName || "";
//       const attendanceRes = await api.get(
//         `/attendance/score/${studentId}/${encodeURIComponent(subjectName)}`,
//       );
//       if (attendanceRes.data?.attendanceScore != null) {
//         setAttendance(String(attendanceRes.data.attendanceScore));
//       }
//     } catch (error) {
//       console.error("Error fetching student data", error);
//     } finally {
//       setScoresFetching(false);
//     }
//   };

//   const resetFields = () => {
//     setInternal(Array(6).fill(""));
//     setExperiments(Array(10).fill(""));
//     setAssignments(Array(2).fill(""));
//     setAttendance("");
//     setPractical("");
//     setTheory("");
//     setMessage({ type: "", text: "" });
//   };

//   // Calculations
//   const internalTotal = useMemo(() => {
//     const sum = internal.map(Number).reduce((a, b) => a + b, 0);
//     return ((sum / 60) * 20).toFixed(2);
//   }, [internal]);

//   const experimentTotal = useMemo(() => {
//     const avg = experiments.map(Number).reduce((a, b) => a + b, 0) / 10;
//     return avg.toFixed(2);
//   }, [experiments]);

//   const assignmentTotal = useMemo(() => {
//     const avg = assignments.map(Number).reduce((a, b) => a + b, 0) / 2;
//     return avg.toFixed(2);
//   }, [assignments]);

//   const grandTotal = useMemo(() => {
//     return (
//       Number(internalTotal) +
//       Number(experimentTotal) +
//       Number(assignmentTotal) +
//       Number(attendance || 0) +
//       Number(practical || 0) +
//       Number(theory || 0)
//     ).toFixed(2);
//   }, [
//     internalTotal,
//     experimentTotal,
//     assignmentTotal,
//     attendance,
//     practical,
//     theory,
//   ]);

//   const handleSaveMarks = async () => {
//     if (!selectedStudent || !activeSubject) return;
//     setSaving(true);
//     try {
//       await api.post("/scores/update", {
//         studentId: selectedStudent,
//         subjectID: activeSubject._id,
//         marks: {
//           internalTests: internal.map(Number),
//           experiments: experiments.map(Number),
//           assignments: assignments.map(Number),
//           practicalOral: Number(practical),
//           theory: Number(theory),
//           internalTotal: Number(internalTotal),
//           experimentTotal: Number(experimentTotal),
//           assignmentTotal: Number(assignmentTotal),
//           totalMarks: Number(grandTotal),
//         },
//       });
//       setMessage({ type: "success", text: "Marks saved successfully!" });
//     } catch (error) {
//       setMessage({ type: "error", text: "Failed to save marks" });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleToggleLock = async () => {
//     if (!activeSubject) return;
//     setLockToggling(true);
//     try {
//       await api.post(`/scores/lock/${activeSubject._id}`, {
//         isLocked: !isMarksLocked,
//       });
//       setIsMarksLocked(!isMarksLocked);
//       setMessage({
//         type: "success",
//         text: `Marks ${!isMarksLocked ? "locked" : "unlocked"} for all students`,
//       });
//     } catch (error) {
//       setMessage({ type: "error", text: "Failed to toggle lock" });
//     } finally {
//       setLockToggling(false);
//     }
//   };

//   const handleDownloadTemplate = async () => {
//     if (!activeSubject) return;
//     try {
//       const response = await api.get(`/teacher/template/${activeSubject._id}`, {
//         responseType: "blob",
//       });
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute(
//         "download",
//         `Template_${activeSubject.subjectCode}.xlsx`,
//       );
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (error) {
//       setMessage({ type: "error", text: "Failed to download template" });
//     }
//   };

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file || !activeSubject) return;

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("subjectId", activeSubject._id);

//     setLoading(true);
//     try {
//       const res = await api.post("/teacher/upload-marks", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       setMessage({ type: "success", text: res.data.message });
//       // Refresh students to show new marks if one is selected
//       if (selectedStudent) fetchStudentData(selectedStudent, activeSubject._id);
//     } catch (error) {
//       setMessage({
//         type: "error",
//         text: error.response?.data?.message || "Upload failed",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!activeSubject) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
//         <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 text-2xl">
//           📚
//         </div>
//         <h2 className="text-xl font-bold text-gray-900">
//           No Active Subject Selected
//         </h2>
//         <p className="text-gray-500 max-w-sm mt-2">
//           Please go to your Profile and select a subject to start entering
//           scores.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col xl:flex-row gap-8 pb-20 max-w-[1400px] mx-auto text-black">
//       {/* Left Sidebar: Student Selection */}
//       <div className="w-full xl:w-80 flex-shrink-0">
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-8">
//           <div className="p-5 border-b border-gray-50 bg-gray-50/50">
//             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
//               Select Student
//             </h3>
//           </div>
//           <div className="p-4 overflow-y-auto max-h-[calc(100vh-250px)] space-y-2">
//             {students.map((student) => {
//               const isSelected = selectedStudent === student._id;
//               return (
//                 <button
//                   key={student._id}
//                   onClick={() => setSelectedStudent(student._id)}
//                   className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col ${
//                     isSelected
//                       ? "border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600"
//                       : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700"
//                   }`}
//                 >
//                   <span
//                     className={`text-sm font-bold ${isSelected ? "text-indigo-700" : "text-white-900"}`}
//                   >
//                     {student.firstName} {student.lastName}
//                   </span>
//                   <span className="text-xs text-gray-500 font-medium">
//                     #{student.registrationNumber}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 space-y-6">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//           <div>
//             <div className="flex items-center gap-2 mb-1">
//               <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-widest">
//                 Marks Entry
//               </span>
//               {isMarksLocked && (
//                 <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase tracking-widest flex items-center gap-1">
//                   🔒 Locked
//                 </span>
//               )}
//             </div>
//             <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
//               {activeSubject.subjectName}{" "}
//               <span className="text-gray-400 font-medium ml-1">
//                 ({activeSubject.subjectCode})
//               </span>
//             </h1>
//           </div>

//           <div className="flex items-center gap-3">
//             <button
//               onClick={handleDownloadTemplate}
//               className="flex items-center gap-2 px-4 py-2 bg-white text-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
//               title="Download Excel Template"
//             >
//               📥 Template
//             </button>
//             <div className="relative">
//               <input
//                 type="file"
//                 id="excel-upload"
//                 className="hidden"
//                 accept=".xlsx, .xls, .csv"
//                 onChange={handleFileUpload}
//               />
//               <label
//                 htmlFor="excel-upload"
//                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer shadow-sm ${loading ? "opacity-50" : ""}`}
//               >
//                 📤 Upload
//               </label>
//             </div>
//             <button
//               onClick={handleToggleLock}
//               disabled={lockToggling}
//               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
//                 isMarksLocked
//                   ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
//                   : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
//               }`}
//             >
//               {lockToggling
//                 ? "Processing..."
//                 : isMarksLocked
//                   ? "Unlock Marks"
//                   : "Lock Marks"}
//             </button>
//             <button
//               onClick={handleSaveMarks}
//               disabled={saving || !selectedStudent}
//               className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
//             >
//               {saving ? (
//                 <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
//               ) : (
//                 "Save All"
//               )}
//             </button>
//           </div>
//         </div>

//         {message.text && (
//           <div
//             className={`p-4 rounded-xl text-sm font-bold border flex items-center gap-3 ${
//               message.type === "success"
//                 ? "bg-emerald-50 text-emerald-700 border-emerald-100"
//                 : "bg-red-50 text-red-700 border-red-100"
//             }`}
//           >
//             <span className="text-lg">
//               {message.type === "success" ? "✓" : "⚠"}
//             </span>
//             {message.text}
//           </div>
//         )}

//         {!selectedStudent ? (
//           <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center">
//             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 text-2xl">
//               👤
//             </div>
//             <h3 className="text-lg font-bold text-gray-900">
//               Select a Student
//             </h3>
//             <p className="text-gray-500">
//               Pick a student from the sidebar to start entering their scores.
//             </p>
//           </div>
//         ) : (
//           <div
//             className={`space-y-6 transition-opacity duration-300 ${scoresFetching ? "opacity-50" : "opacity-100"}`}
//           >
//             {/* Form Sections */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Internal Tests */}
//               {currentSubjectType !== "Lab+Practical" && (
//                 <SectionCard
//                   title="Internal Tests"
//                   subtitle="Out of 10 each"
//                   total={internalTotal}
//                   max="20"
//                 >
//                   <div className="grid grid-cols-3 gap-4">
//                     {internal.map((val, i) => (
//                       <ScoreField
//                         key={i}
//                         label={`Test ${i + 1}`}
//                         value={val}
//                         readOnly={isMarksLocked}
//                         onChange={(v) => {
//                           const next = [...internal];
//                           next[i] = v;
//                           setInternal(next);
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </SectionCard>
//               )}

//               {/* Experiments */}
//               {currentSubjectType !== "Theory" && (
//                 <SectionCard
//                   title="Experiments"
//                   subtitle="Out of 15 each"
//                   total={experimentTotal}
//                   max="15"
//                 >
//                   <div className="grid grid-cols-5 gap-3">
//                     {experiments.map((val, i) => (
//                       <ScoreField
//                         key={i}
//                         label={`E${i + 1}`}
//                         value={val}
//                         readOnly={isMarksLocked}
//                         onChange={(v) => {
//                           const next = [...experiments];
//                           next[i] = v;
//                           setExperiments(next);
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </SectionCard>
//               )}

//               {/* Assignments */}
//               {currentSubjectType !== "Theory" && (
//                 <SectionCard
//                   title="Assignments"
//                   subtitle="Out of 5 each"
//                   total={assignmentTotal}
//                   max="5"
//                 >
//                   <div className="grid grid-cols-2 gap-4">
//                     {assignments.map((val, i) => (
//                       <ScoreField
//                         key={i}
//                         label={`Assignment ${i + 1}`}
//                         value={val}
//                         readOnly={isMarksLocked}
//                         onChange={(v) => {
//                           const next = [...assignments];
//                           next[i] = v;
//                           setAssignments(next);
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </SectionCard>
//               )}

//               {/* Attendance */}
//               <SectionCard
//                 title="Attendance"
//                 subtitle="Calculated Score"
//                 total={attendance || "0"}
//                 max="5"
//               >
//                 <div className="space-y-4">
//                   <ScoreField
//                     label="Score"
//                     value={attendance}
//                     readOnly={isMarksLocked}
//                     onChange={setAttendance}
//                   />
//                   <p className="text-xs text-gray-500 italic">
//                     Auto-filled from attendance logs. You can override if
//                     required.
//                   </p>
//                 </div>
//               </SectionCard>

//               {/* Practical / Oral */}
//               {currentSubjectType === "Theory+Lab+Practical" && (
//                 <SectionCard
//                   title="Practical / Oral"
//                   subtitle="Out of 25"
//                   total={practical || "0"}
//                   max="25"
//                 >
//                   <ScoreField
//                     label="Marks"
//                     value={practical}
//                     readOnly={isMarksLocked}
//                     onChange={setPractical}
//                   />
//                 </SectionCard>
//               )}

//               {/* Theory Exam */}
//               {currentSubjectType !== "Lab+Practical" && (
//                 <SectionCard
//                   title="Theory Exam"
//                   subtitle="Out of 80"
//                   total={theory || "0"}
//                   max="80"
//                 >
//                   <ScoreField
//                     label="Marks"
//                     value={theory}
//                     readOnly={isMarksLocked}
//                     onChange={setTheory}
//                   />
//                 </SectionCard>
//               )}
//             </div>

//             {/* Grand Total Footer */}
//             <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
//               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-600/20 transition-all" />
//               <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
//                 <div className="text-center md:text-left">
//                   <h4 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
//                     Grand Total Marks
//                   </h4>
//                   <p className="text-gray-500 text-sm max-w-xs">
//                     Sum of Internals, Lab Work, Results, and Theory Exam
//                     components.
//                   </p>
//                 </div>
//                 <div className="flex flex-col items-center md:items-end">
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-6xl font-black text-white tracking-tighter">
//                       {grandTotal}
//                     </span>
//                     <span className="text-gray-500 font-bold text-xl">
//                       /{" "}
//                       {currentSubjectType === "Theory+Lab+Practical"
//                         ? "150"
//                         : currentSubjectType === "Theory+Lab"
//                           ? "125"
//                           : currentSubjectType === "Theory"
//                             ? "100"
//                             : "50"}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Sub-components for cleaner code
// const SectionCard = ({ title, subtitle, total, max, children }) => (
//   <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
//     <div className="flex items-start justify-between mb-6">
//       <div>
//         <h4 className="text-base font-bold text-gray-900 leading-tight">
//           {title}
//         </h4>
//         <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
//       </div>
//       <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
//         <span className="text-xs font-bold text-indigo-700">{total}</span>
//         <span className="text-[10px] font-medium text-indigo-400">/ {max}</span>
//       </div>
//     </div>
//     <div className="flex-1">{children}</div>
//   </div>
// );

// const ScoreField = ({ label, value, onChange, readOnly }) => (
//   <div className="space-y-2">
//     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block text-center">
//       {label}
//     </label>
//     <input
//       type="number"
//       value={value}
//       readOnly={readOnly}
//       onChange={(e) => onChange(e.target.value)}
//       className={`w-full text-center py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold transition-all hover:border-indigo-300 ${
//         readOnly ? "border-amber-200 ring-1 ring-amber-100" : ""
//       }`}
//       placeholder="—"
//     />
//   </div>
// );

// export default ScoresEntering;

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/useAuth";
import api from "../../api/axios";

// ─── Sub-components ───────────────────────────────────────────────────────────

const ScoreField = ({ label, value, onChange, readOnly }) => (
  <div className="flex flex-col items-center gap-1.5">
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center leading-tight">
      {label}
    </span>
    <input
      type="number"
      value={value}
      readOnly={readOnly}
      onChange={(e) => !readOnly && onChange(e.target.value)}
      placeholder="—"
      className={`
        w-full text-center text-sm font-bold rounded-lg border px-1 py-2.5 outline-none
        transition-all duration-150
        ${
          readOnly
            ? "bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed select-none"
            : "bg-white border-gray-200 text-gray-900 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        }
      `}
    />
  </div>
);

const SectionCard = ({
  title,
  subtitle,
  score,
  max,
  accent = "indigo",
  children,
}) => {
  const accentMap = {
    indigo: {
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
      dot: "bg-indigo-500",
    },
    violet: {
      badge: "bg-violet-50 text-violet-700 border-violet-100",
      dot: "bg-violet-500",
    },
    sky: { badge: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" },
    teal: {
      badge: "bg-teal-50 text-teal-700 border-teal-100",
      dot: "bg-teal-500",
    },
    amber: {
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      dot: "bg-amber-500",
    },
  };
  const colors = accentMap[accent] || accentMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${colors.dot}`}
          />
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">
              {title}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div
          className={`flex items-baseline gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border ${colors.badge}`}
        >
          <span className="text-sm">{score}</span>
          <span className="opacity-60 font-medium">/ {max}</span>
        </div>
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
};

const Toast = ({ message, onDismiss }) => {
  if (!message.text) return null;
  const isSuccess = message.type === "success";
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border
        ${
          isSuccess
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {isSuccess ? "✓" : "!"}
      </span>
      <span className="flex-1">{message.text}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-40 hover:opacity-70 transition-opacity text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ScoresEntering = () => {
  const { user, activeSubject } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [scoresFetching, setScoresFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMarksLocked, setIsMarksLocked] = useState(false);
  const [lockToggling, setLockToggling] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [internal, setInternal] = useState(Array(6).fill(""));
  const [experiments, setExperiments] = useState(Array(10).fill(""));
  const [assignments, setAssignments] = useState(Array(2).fill(""));
  const [attendance, setAttendance] = useState("");
  const [practical, setPractical] = useState("");
  const [theory, setTheory] = useState("");

  const currentSubjectType = activeSubject?.subjectType || "";

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent || !activeSubject) {
      resetFields();
      return;
    }
    resetFields();
    fetchStudentData(selectedStudent, activeSubject._id);
    fetchMarkLockStatus(activeSubject._id);
  }, [selectedStudent, activeSubject]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/students");
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkLockStatus = async (subjectId) => {
    try {
      const res = await api.get(`/scores/lock/status/${subjectId}`);
      setIsMarksLocked(res.data?.isLocked || false);
    } catch (_) {
      setIsMarksLocked(false);
    }
  };

  const fetchStudentData = async (studentId, subjectId) => {
    setScoresFetching(true);
    try {
      const marksRes = await api.get(`/scores/${studentId}/${subjectId}`);
      const marks = marksRes.data?.marks;
      if (marks) {
        if (marks.internalTests)
          setInternal(
            marks.internalTests.map((v) => (v === null ? "" : String(v))),
          );
        if (marks.experiments)
          setExperiments(
            marks.experiments.map((v) => (v === null ? "" : String(v))),
          );
        if (marks.assignments)
          setAssignments(
            marks.assignments.map((v) => (v === null ? "" : String(v))),
          );
        if (marks.practicalOral != null)
          setPractical(String(marks.practicalOral));
        if (marks.theory != null) setTheory(String(marks.theory));
        if (marks.attendanceScore != null)
          setAttendance(String(marks.attendanceScore));
      }
      const subjectName = activeSubject?.subjectName || "";
      const attRes = await api.get(
        `/attendance/score/${studentId}/${encodeURIComponent(subjectName)}`,
      );
      if (attRes.data?.attendanceScore != null)
        setAttendance(String(attRes.data.attendanceScore));
    } catch (e) {
      console.error(e);
    } finally {
      setScoresFetching(false);
    }
  };

  const resetFields = () => {
    setInternal(Array(6).fill(""));
    setExperiments(Array(10).fill(""));
    setAssignments(Array(2).fill(""));
    setAttendance("");
    setPractical("");
    setTheory("");
    setMessage({ type: "", text: "" });
  };

  const internalTotal = useMemo(() => {
    const sum = internal.map(Number).reduce((a, b) => a + b, 0);
    return ((sum / 60) * 20).toFixed(2);
  }, [internal]);

  const experimentTotal = useMemo(() => {
    const avg = experiments.map(Number).reduce((a, b) => a + b, 0) / 10;
    return avg.toFixed(2);
  }, [experiments]);

  const assignmentTotal = useMemo(() => {
    const avg = assignments.map(Number).reduce((a, b) => a + b, 0) / 2;
    return avg.toFixed(2);
  }, [assignments]);

  const maxTotal =
    currentSubjectType === "Theory+Lab+Practical"
      ? 150
      : currentSubjectType === "Theory+Lab"
        ? 125
        : currentSubjectType === "Theory"
          ? 100
          : 50;

  const grandTotal = useMemo(
    () =>
      (
        Number(internalTotal) +
        Number(experimentTotal) +
        Number(assignmentTotal) +
        Number(attendance || 0) +
        Number(practical || 0) +
        Number(theory || 0)
      ).toFixed(2),
    [
      internalTotal,
      experimentTotal,
      assignmentTotal,
      attendance,
      practical,
      theory,
    ],
  );

  const completionPct = Math.min(
    100,
    Math.round((Number(grandTotal) / maxTotal) * 100),
  );

  const handleSaveMarks = async () => {
    if (!selectedStudent || !activeSubject) return;
    setSaving(true);
    try {
      await api.post("/scores/update", {
        studentId: selectedStudent,
        subjectID: activeSubject._id,
        marks: {
          internalTests: internal.map(Number),
          experiments: experiments.map(Number),
          assignments: assignments.map(Number),
          practicalOral: Number(practical),
          theory: Number(theory),
          internalTotal: Number(internalTotal),
          experimentTotal: Number(experimentTotal),
          assignmentTotal: Number(assignmentTotal),
          totalMarks: Number(grandTotal),
        },
      });
      showMsg("success", "Marks saved successfully!");
    } catch (_) {
      showMsg("error", "Failed to save marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (!activeSubject) return;
    setLockToggling(true);
    try {
      await api.post(`/scores/lock/${activeSubject._id}`, {
        isLocked: !isMarksLocked,
      });
      setIsMarksLocked(!isMarksLocked);
      showMsg(
        "success",
        `Marks ${!isMarksLocked ? "locked" : "unlocked"} for all students.`,
      );
    } catch (_) {
      showMsg("error", "Failed to toggle lock status.");
    } finally {
      setLockToggling(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!activeSubject) return;
    try {
      const response = await api.get(`/teacher/template/${activeSubject._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Template_${activeSubject.subjectCode}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (_) {
      showMsg("error", "Failed to download template.");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !activeSubject) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", activeSubject._id);
    setLoading(true);
    try {
      const res = await api.post("/teacher/upload-marks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showMsg("success", res.data.message);
      if (selectedStudent) fetchStudentData(selectedStudent, activeSubject._id);
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.registrationNumber?.toString().includes(q)
    );
  });

  const selectedStudentObj = students.find((s) => s._id === selectedStudent);

  // ── No active subject guard ──
  if (!activeSubject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl mb-6">
          📚
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No Subject Selected
        </h2>
        <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
          Go to your profile and select an active subject to start entering
          scores.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 pb-20 max-w-[1440px] mx-auto">
      {/* ── Left Sidebar ── */}
      <aside className="w-72 flex-shrink-0 sticky top-6 self-start">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Students
            </p>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search students…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 placeholder:text-gray-300 transition-all"
              />
            </div>
          </div>

          {/* Student list */}
          <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Loading…</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No students found
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent === student._id;
                  const initials =
                    `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
                  return (
                    <button
                      key={student._id}
                      onClick={() => setSelectedStudent(student._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 group
                        ${
                          isSelected
                            ? "bg-indigo-600 shadow-md shadow-indigo-200"
                            : "hover:bg-gray-50"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                        ${isSelected ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate leading-tight ${isSelected ? "text-blue-400" : "text-white-800"}`}
                        >
                          {student.firstName} {student.lastName}
                        </p>
                        <p
                          className={`text-[10px] font-medium truncate ${isSelected ? "text-indigo-200" : "text-gray-400"}`}
                        >
                          #{student.registrationNumber}
                        </p>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-indigo-200 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Top bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Subject info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-widest">
                  Marks Entry
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-md uppercase tracking-wider">
                  {activeSubject.subjectCode}
                </span>
                {isMarksLocked && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-widest flex items-center gap-1">
                    🔒 Locked
                  </span>
                )}
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {activeSubject.subjectName}
              </h1>
              {selectedStudentObj && (
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  Editing: {selectedStudentObj.firstName}{" "}
                  {selectedStudentObj.lastName} · #
                  {selectedStudentObj.registrationNumber}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Download template */}
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Marks Template
              </button>

              {/* Upload excel */}
              <div className="relative">
                <input
                  type="file"
                  id="excel-upload"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="excel-upload"
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-blue-500 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                  )}
                  Upload Student Marks
                </label>
              </div>

              {/* Lock/Unlock */}
              <button
                onClick={handleToggleLock}
                disabled={lockToggling}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors disabled:opacity-60
                  ${
                    isMarksLocked
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  }`}
              >
                {lockToggling ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isMarksLocked ? "🔓" : "🔒"}</span>
                )}
                {lockToggling
                  ? "Processing…"
                  : isMarksLocked
                    ? "Unlock"
                    : "Lock Marks"}
              </button>

              {/* Save */}
              <button
                onClick={handleSaveMarks}
                disabled={saving || !selectedStudent}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                Save All
              </button>
              <button
                onClick={() =>
                  fetchStudentData(selectedStudent, activeSubject._id)
                }
                className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-95"
                title="Refresh Data"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {message.text && (
          <Toast
            message={message}
            onDismiss={() => setMessage({ type: "", text: "" })}
          />
        )}

        {/* No student selected */}
        {!selectedStudent ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
              👤
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Select a student
            </h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Pick a student from the sidebar to begin entering their marks.
            </p>
          </div>
        ) : (
          <div
            className={`space-y-5 transition-opacity duration-300 ${scoresFetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}
          >
            {/* Loading overlay indicator */}
            {scoresFetching && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Loading saved scores…
              </div>
            )}

            {/* Mark entry grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentSubjectType !== "Lab+Practical" && (
                <SectionCard
                  title="Internal Tests"
                  subtitle="6 tests · out of 10 each"
                  score={internalTotal}
                  max="20"
                  accent="indigo"
                >
                  <div className="grid grid-cols-3 gap-3">
                    {internal.map((val, i) => (
                      <ScoreField
                        key={i}
                        label={`Test ${i + 1}`}
                        value={val}
                        readOnly={isMarksLocked}
                        onChange={(v) => {
                          const n = [...internal];
                          n[i] = v;
                          setInternal(n);
                        }}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}

              {currentSubjectType !== "Theory" && (
                <SectionCard
                  title="Experiments"
                  subtitle="10 experiments · out of 15 each"
                  score={experimentTotal}
                  max="15"
                  accent="violet"
                >
                  <div className="grid grid-cols-5 gap-2">
                    {experiments.map((val, i) => (
                      <ScoreField
                        key={i}
                        label={`E${i + 1}`}
                        value={val}
                        readOnly={isMarksLocked}
                        onChange={(v) => {
                          const n = [...experiments];
                          n[i] = v;
                          setExperiments(n);
                        }}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}

              {currentSubjectType !== "Theory" && (
                <SectionCard
                  title="Assignments"
                  subtitle="2 assignments · out of 5 each"
                  score={assignmentTotal}
                  max="5"
                  accent="sky"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {assignments.map((val, i) => (
                      <ScoreField
                        key={i}
                        label={`Assignment ${i + 1}`}
                        value={val}
                        readOnly={isMarksLocked}
                        onChange={(v) => {
                          const n = [...assignments];
                          n[i] = v;
                          setAssignments(n);
                        }}
                      />
                    ))}
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Attendance"
                subtitle="Auto-calculated · editable"
                score={attendance || "0"}
                max="5"
                accent="teal"
              >
                <ScoreField
                  label="Score"
                  value={attendance}
                  readOnly={isMarksLocked}
                  onChange={setAttendance}
                />
                <p className="text-[11px] text-gray-400 italic mt-3 leading-relaxed">
                  Auto-filled from attendance records. Override if needed.
                </p>
              </SectionCard>

              {currentSubjectType === "Theory+Lab+Practical" && (
                <SectionCard
                  title="Practical / Oral"
                  subtitle="Out of 25"
                  score={practical || "0"}
                  max="25"
                  accent="amber"
                >
                  <ScoreField
                    label="Marks"
                    value={practical}
                    readOnly={isMarksLocked}
                    onChange={setPractical}
                  />
                </SectionCard>
              )}

              {currentSubjectType !== "Lab+Practical" && (
                <SectionCard
                  title="Theory Exam"
                  subtitle="End-semester exam · out of 80"
                  score={theory || "0"}
                  max="80"
                  accent="indigo"
                >
                  <ScoreField
                    label="Marks"
                    value={theory}
                    readOnly={isMarksLocked}
                    onChange={setTheory}
                  />
                </SectionCard>
              )}
            </div>

            {/* Grand Total */}
            <div className="bg-gray-950 rounded-2xl p-7 shadow-xl overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 80% 50%, #6366f1 0%, transparent 60%)",
                }}
              />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                {/* Left: label + progress */}
                <div className="flex-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                    Grand Total
                  </p>
                  <p className="text-gray-400 text-xs mb-4 max-w-xs leading-relaxed">
                    Combined score across all components of{" "}
                    {activeSubject.subjectName}
                  </p>
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-gray-500">Completion</span>
                      <span className="text-indigo-400">{completionPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: score */}
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-white tracking-tighter tabular-nums">
                    {grandTotal}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-sm font-bold">
                      /{maxTotal}
                    </span>
                    <span className="text-gray-600 text-[10px]">marks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoresEntering;
