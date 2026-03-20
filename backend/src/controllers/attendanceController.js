const mongoose = require("mongoose");
const crypto = require("crypto");
const AttendanceSession = require("../models/AttendanceSession.js");
const AttendanceRecord = require("../models/AttendanceRecord.js");
const Student = require("../models/Student.js");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — build a today-midnight Date from a "HH:MM" string
// ─────────────────────────────────────────────────────────────────────────────
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.trim().split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return date;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — today at midnight (for the session `date` field)
// ─────────────────────────────────────────────────────────────────────────────
const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — lazy-close a session if its duration has passed
// ─────────────────────────────────────────────────────────────────────────────
const checkAndCloseIfExpired = async (session) => {
  if (!session || session.status === "closed") return null;

  const now = new Date();
  const expiryTime = new Date(
    session.createdAt.getTime() + session.duration * 60000,
  );

  if (now > expiryTime) {
    session.status = "closed";
    await session.save();
    return null;
  }
  return session;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/start
// Body: { subject, department, semester, section, sessionType,
//         lectureStart, lectureEnd, duration, topic, totalStudents }
// Auth: req.user set by protect middleware  ← teacherId comes from here, NOT body
// ─────────────────────────────────────────────────────────────────────────────
const startAttendanceSession = async (req, res) => {
  try {
    const {
      subject,
      department,
      semester,
      section,
      sessionType,
      lectureStart,
      lectureEnd,
      duration,
      topic,
      totalStudents, // number of enrolled students — used for absent calculation
      user,
    } = req.body;

    // teacherId must come from the verified JWT, never from the body
    const teacherId = user;

    // Prevent a teacher from starting a second session while one is still active
    const existing = await AttendanceSession.findOne({
      teacher: teacherId,
      status: "active",
    });
    if (existing) {
      return res.status(400).json({
        message:
          "You already have an active session. Close it before starting a new one.",
      });
    }

    // Only attach section for Practical sessions
    const sessionData = {
      subject,
      teacher: teacherId,
      department,
      semester,
      sessionType,
      date: todayMidnight(),
      lectureStart: parseTime(lectureStart),
      lectureEnd: parseTime(lectureEnd),
      duration,
      topic: topic || "",
      totalStudents: totalStudents || 0,
      bluetoothToken: crypto.randomBytes(16).toString("hex"),
    };

    if (sessionType === "Practical" && section) {
      sessionData.section = section;
    }

    const session = await AttendanceSession.create(sessionData);

    // Populate before returning so the frontend gets full subject/teacher objects
    const populated = await session.populate([
      { path: "subject", select: "subjectName" },
      { path: "teacher", select: "firstName lastName" },
      { path: "department", select: "departmentName" },
    ]);

    res.status(201).json({
      message: "Attendance session started",
      session: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, bluetoothToken, deviceId, user } = req.body;

    // 1. Validate required fields
    if (!sessionId || !bluetoothToken || !deviceId) {
      return res.status(400).json({
        message: "sessionId, bluetoothToken and deviceId are required.",
      });
    }

    // 2. Find session by ID first, then verify token — avoids a full-collection token scan
    let session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Lazy-close if expired
    session = await checkAndCloseIfExpired(session);

    if (!session || session.status !== "active") {
      return res
        .status(400)
        .json({ message: "This attendance session has already closed." });
    }

    // 3. Verify bluetooth token — constant-time compare prevents timing attacks
    const tokenMatch = crypto.timingSafeEqual(
      Buffer.from(session.bluetoothToken),
      Buffer.from(bluetoothToken),
    );
    if (!tokenMatch) {
      return res.status(403).json({ message: "Invalid Bluetooth token." });
    }

    // 4. For Practical sessions — verify the student belongs to this section
    if (session.sessionType === "Practical") {
      if (user.section && user.section !== session.section) {
        return res.status(403).json({
          message: `This session is for Section ${session.section}. You are in Section ${user.section}.`,
        });
      }
    }

    // 5. Hash the deviceId before storing (never persist raw hardware IDs)
    const hashedDeviceId = crypto
      .createHash("sha256")
      .update(deviceId)
      .digest("hex");

    // 6. Create the record — the unique indexes on (session+student) and
    //    (session+deviceId) will throw E11000 if either constraint is violated,
    //    which handles both "already marked" and "proxy via same device" in one shot.
    const record = await AttendanceRecord.create({
      session: session._id,
      student: studentId,
      deviceId: hashedDeviceId,
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      record,
    });
  } catch (error) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      const isDeviceConflict = error.keyPattern?.deviceId;
      return res.status(400).json({
        message: isDeviceConflict
          ? "Another student has already marked attendance from this device."
          : "Attendance already marked for this session.",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const closeAttendanceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.body.userId;

    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Prevent one teacher from closing another teacher's session
    if (session.teacher.toString() !== teacherId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorised to close this session." });
    }

    if (session.status === "closed") {
      return res.status(400).json({ message: "Session is already closed." });
    }

    session.status = "closed";
    await session.save();

    res.json({ message: "Attendance session closed." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveTeacherSession = async (req, res) => {
  try {
    const teacherId = req.query.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required." });
    }

    const session = await AttendanceSession.findOne({
      teacher: teacherId,
      status: "active",
    }).populate("subject", "subjectName");

    if (!session) {
      return res.json(null);
    }

    // Lazy-close if expired
    const activeSession = await checkAndCloseIfExpired(session);
    res.json(activeSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/history?subjectId=&month=
// Returns attendance history + summary for the TEACHER view.
// Query: subjectId (required), month (optional, "01"–"12"), studentId (optional)
// ─────────────────────────────────────────────────────────────────────────────
const getAttendanceHistory = async (req, res) => {
  try {
    const { subjectId, month, studentId, type } = req.query;

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    // ── Step 0: Find all students enrolled in this subject's criteria ───────
    // We need this to get a full student list for the filter AND for accurate absent counts.
    const Subject = require("../models/Subject.js");
    const subject = await Subject.findById(subjectId);
    if (!subject)
      return res.status(404).json({ message: "Subject not found." });

    const studentCriteria = {
      department: subject.department,
      // semester: subject.semester, // Optional: if students switch semesters
    };
    // Note: section filtering is handled per-session for Practicals,
    // but the teacher might want to see all students in the department/semester.
    const allStudentsEnrolled = await Student.find(studentCriteria)
      .select("firstName lastName rollNumber section")
      .sort({ rollNumber: 1 });

    // ── Step 1: find all closed sessions for this subject ──────────────────
    const sessionQuery = {
      subject: new mongoose.Types.ObjectId(subjectId),
      status: "closed",
    };

    if (month && month !== "overall") {
      const year = new Date().getFullYear();
      sessionQuery.date = {
        $gte: new Date(year, parseInt(month, 10) - 1, 1),
        $lt: new Date(year, parseInt(month, 10), 1),
      };
    }

    if (type && type !== "all") {
      sessionQuery.sessionType = type;
    }

    const sessions = await AttendanceSession.find(sessionQuery)
      .populate("subject", "subjectName")
      .sort({ date: -1 });

    if (sessions.length === 0) {
      return res.json({
        history: [],
        summary: { totalClasses: 0, attended: 0, absent: 0, rate: 0 },
        students: allStudentsEnrolled.map((s) => ({
          _id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          roll: s.rollNumber,
        })),
      });
    }

    const sessionIds = sessions.map((s) => s._id);

    // ── Step 2: fetch all records for those sessions ───────────────────────
    const recordQuery = { session: { $in: sessionIds } };
    if (studentId && studentId !== "all") {
      recordQuery.student = new mongoose.Types.ObjectId(studentId);
    }

    const records = await AttendanceRecord.find(recordQuery).populate(
      "student",
      "firstName lastName rollNumber",
    );

    // Build a lookup: sessionId → Set of present studentIds
    const presentMap = {};
    sessions.forEach((s) => {
      presentMap[s._id.toString()] = new Set();
    });
    records.forEach((r) => {
      if (r.student) {
        presentMap[r.session.toString()]?.add(r.student._id.toString());
      }
    });

    // ── Step 3: build history rows ─────────────────────────────────────────
    const history = records.map((r) => {
      const sess = sessions.find(
        (s) => s._id.toString() === r.session.toString(),
      );
      const d = new Date(sess.date);
      return {
        _id: r._id.toString(),
        date: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        monthLabel: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
        dayNum: String(d.getDate()).padStart(2, "0"),
        dayLabel: d.toLocaleString("en-US", { weekday: "long" }),
        time: new Date(sess.lectureStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        subjectName: sess.subject?.subjectName || "",
        sessionType: sess.sessionType,
        topic: sess.topic || "",
        studentName: r.student
          ? `${r.student.firstName} ${r.student.lastName}`
          : "Unknown Student",
        studentRoll: r.student?.rollNumber || "",
        status: "PRESENT",
      };
    });

    // ── Step 4: summary ───────────────────────────────────────────────────
    const totalClasses = sessions.length;
    let totalPresent = records.length;
    let totalAbsent = 0;
    let rate = 0;

    if (studentId && studentId !== "all") {
      // Single student summary
      totalPresent = records.length;
      totalAbsent = totalClasses - totalPresent;
      rate =
        totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    } else {
      // Overall class summary
      totalAbsent = sessions.reduce((acc, sess) => {
        const presentInSess = presentMap[sess._id.toString()].size;
        // If sess.totalStudents is 0, fall back to current enrollment count
        const expected = sess.totalStudents || allStudentsEnrolled.length;
        return acc + Math.max(0, expected - presentInSess);
      }, 0);
      rate =
        totalPresent + totalAbsent > 0
          ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
          : 0;
    }

    // ── Step 5: student list for the filter dropdown (all enrolled) ─────────
    const studentsForFilter = allStudentsEnrolled.map((s) => ({
      _id: s._id,
      name: `${s.firstName} ${s.lastName}`,
      roll: s.rollNumber,
    }));

    res.json({
      history,
      summary: {
        totalClasses,
        attended: totalPresent,
        absent: totalAbsent,
        rate,
      },
      students: studentsForFilter,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/student-history?subjectId=&month=
// Returns attendance history + summary for the STUDENT view (their own records only).
// Auth: studentId from req.user._id
// ─────────────────────────────────────────────────────────────────────────────
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { subjectId, month, userId, section } = req.query;
    const studentId = userId;

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    // ── Step 1: sessions for this subject ─────────────────────────────────
    const sessionQuery = {
      subject: new mongoose.Types.ObjectId(subjectId),
      status: "closed",
    };

    if (month) {
      const year = new Date().getFullYear();
      sessionQuery.date = {
        $gte: new Date(year, parseInt(month, 10) - 1, 1),
        $lt: new Date(year, parseInt(month, 10), 1),
      };
    }

    // For Practical — only sessions for the student's own section
    if (section) {
      sessionQuery.$or = [
        { sessionType: { $in: ["Lecture", "Extra Class"] } },
        { sessionType: "Practical", section: section },
      ];
    }
    const sessions = await AttendanceSession.find(sessionQuery)
      .populate("subject", "subjectName")
      .sort({ date: -1 });

    const sessionIds = sessions.map((s) => s._id);

    // ── Step 2: this student's records ────────────────────────────────────
    const records = await AttendanceRecord.find({
      session: { $in: sessionIds },
      student: studentId,
    });

    const presentSessionIds = new Set(records.map((r) => r.session.toString()));

    // ── Step 3: build one row per session (PRESENT or ABSENT) ─────────────
    const history = sessions.map((sess) => {
      const d = new Date(sess.date);
      const isPresent = presentSessionIds.has(sess._id.toString());
      return {
        _id: sess._id.toString(),
        date: d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        monthLabel: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
        dayNum: String(d.getDate()).padStart(2, "0"),
        dayLabel: d.toLocaleString("en-US", { weekday: "long" }),
        time: new Date(sess.lectureStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        subjectName: sess.subject?.subjectName || "",
        sessionType: sess.sessionType,
        topic: sess.topic || "",
        status: isPresent ? "PRESENT" : "ABSENT",
      };
    });

    // ── Step 4: summary ───────────────────────────────────────────────────
    const totalClasses = sessions.length;
    const attended = records.length;
    const absent = totalClasses - attended;
    const rate =
      totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

    res.json({
      history,
      summary: { totalClasses, attended, absent, rate },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/student-overall
// Returns aggregate overall attendance percentage for the STUDENT.
// Auth: studentId from req.user._id
// ─────────────────────────────────────────────────────────────────────────────
const getStudentOverallAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const section = req.params.section;

    // First fetch all of the student's records
    const attendedRecords = await AttendanceRecord.find({
      student: studentId,
    });

    // We only care about records for sessions that are closed
    const attendedSessionIds = attendedRecords.map((r) => r.session);

    // Get all those sessions
    const attendedSessions = await AttendanceSession.find({
      _id: { $in: attendedSessionIds },
      status: "closed",
    });

    const totalAttended = attendedSessions.length;

    // Now figure out how many total classes there have been for the student's program overall
    // We assume the student's program is defined by their department and section.
    // To be perfectly accurate across all subjects, we just fetch all closed sessions
    // that apply to this student's section/lectures
    const sessionQuery = {
      status: "closed",
    };

    if (section) {
      sessionQuery.$or = [
        { sessionType: { $in: ["Lecture", "Extra Class"] } },
        { sessionType: "Practical", section: section },
      ];
    }

    const allSessions = await AttendanceSession.find(sessionQuery);
    const totalClasses = allSessions.length;
    const rate = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

    res.json({
      rate: parseFloat(rate.toFixed(1)), // Keep it to 1 decimal place
      totalClasses,
      attended: totalAttended,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({
      status: "active",
    });

    // Lazy-close all expired sessions found
    const filteredSessions = [];
    for (const sess of sessions) {
      const active = await checkAndCloseIfExpired(sess);
      if (active) filteredSessions.push(active);
    }

    res.json(filteredSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startAttendanceSession,
  markAttendance,
  closeAttendanceSession,
  getActiveSessions,
  getActiveTeacherSession, // Exported
  getAttendanceHistory,
  getStudentAttendanceHistory,
  getStudentOverallAttendance,
};
