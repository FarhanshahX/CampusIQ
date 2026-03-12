// const express = require("express");
// const {
//   startAttendanceSession,
//   markAttendance,
//   closeAttendanceSession,
//   getAttendanceStats,
//   getActiveSessions,
// } = require("../controllers/attendanceController.js");
// const { protect } = require("../middleware/authMiddleware.js");

// const router = express.Router();

// router.post("/start", startAttendanceSession);

// router.post("/mark", markAttendance);

// router.put("/close/:sessionId", closeAttendanceSession);

// router.get("/stats/:subjectId", getAttendanceStats);

// router.get("/active", getActiveSessions);

// module.exports = router;

const express = require("express");
const {
  startAttendanceSession,
  markAttendance,
  closeAttendanceSession,
  getActiveSessions,
  getAttendanceHistory,
  getStudentAttendanceHistory,
} = require("../controllers/attendanceController.js");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();

// All routes are protected — req.user is guaranteed to exist
router.use(protect);

// ── Teacher routes ──────────────────────────────────────────────────────────
router.post("/start", startAttendanceSession); // Start a new session
router.put("/close/:sessionId", closeAttendanceSession); // Close an active session
router.get("/history", getAttendanceHistory); // Teacher: history + summary for a subject

// ── Shared ──────────────────────────────────────────────────────────────────
router.post("/mark", markAttendance); // Student marks attendance
router.get("/active", getActiveSessions); // Active sessions (teacher sees own, student sees theirs)

// ── Student routes ──────────────────────────────────────────────────────────
router.get("/student-history", getStudentAttendanceHistory); // Student: own history + summary

module.exports = router;
