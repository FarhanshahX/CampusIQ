const express = require("express");
const {
  startAttendanceSession,
  markAttendance,
  closeAttendanceSession,
  getActiveSessions,
  getActiveTeacherSession,
  getAttendanceHistory,
  getStudentAttendanceHistory,
  getStudentOverallAttendance,
} = require("../controllers/attendanceController.js");

const router = express.Router();

// ── Teacher routes ──────────────────────────────────────────────────────────
router.post("/start", startAttendanceSession); // Start a new session
router.put("/close/:sessionId", closeAttendanceSession); // Close an active session
router.get("/active-teacher-session", getActiveTeacherSession); // Recover active session for teacher
router.get("/history", getAttendanceHistory); // Teacher: history + summary for a subject

// ── Shared ──────────────────────────────────────────────────────────────────
router.post("/mark", markAttendance); // Student marks attendance
router.get("/active", getActiveSessions); // Active sessions (teacher sees own, student sees theirs)

// ── Student routes ──────────────────────────────────────────────────────────
router.get("/student-history", getStudentAttendanceHistory); // Student: own history + summary
router.get("/student-overall/:studentId/:section", getStudentOverallAttendance); // Student: aggregate overall attendance percentage

module.exports = router;
