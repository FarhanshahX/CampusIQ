const mongoose = require("mongoose");
const crypto = require("crypto");
const geolib = require("geolib");
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
      latitude,
      longitude,
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

    if (!latitude || !longitude) {
      return res.status(400).json({
        message:
          "Teacher location (latitude/longitude) is required to start a session.",
      });
    }

    // Generate a simple 4-digit numeric OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

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
      otp,
      latitude,
      longitude,
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

    const sessionObj = populated.toObject();
    sessionObj.remainingSeconds = duration * 60;

    res.status(201).json({
      message: "Attendance session started",
      session: sessionObj,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, otp, latitude, longitude, deviceId, user } =
      req.body;

    // 1. Validate required fields
    if (!sessionId || !otp || !latitude || !longitude || !deviceId) {
      return res.status(400).json({
        message:
          "sessionId, otp, latitude, longitude and deviceId are required.",
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

    // 3. Verify OTP
    if (session.otp !== otp) {
      return res.status(403).json({ message: "Invalid OTP code." });
    }

    // 3.5 Verify Distance (within 5 meters)
    const distance = geolib.getDistance(
      { latitude: session.latitude, longitude: session.longitude },
      { latitude, longitude },
    );

    if (distance > 5) {
      return res.status(403).json({
        message: `You are too far from the teacher (${distance}m). Please move closer.`,
      });
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
    if (!activeSession) return res.json(null);

    const expiresAt = new Date(
      activeSession.createdAt.getTime() + activeSession.duration * 60000,
    );
    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt - Date.now()) / 1000),
    );

    res.json({ ...activeSession.toObject(), remainingSeconds });
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
    const { subjectId, month, studentId, type, sessionId } = req.query;
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

    if (sessionId && sessionId !== "all") {
      sessionQuery._id = new mongoose.Types.ObjectId(sessionId);
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

    // ── Step 4: summary & history formatting ─────────────────────────────
    const totalClasses = sessions.length;
    let totalPresent = records.length;
    let totalAbsent = 0;
    let rate = 0;

    let historyResult = [];

    if (studentId && studentId !== "all") {
      // ── CASE A: Single student summary ───────────────────────────
      totalPresent = records.length;
      totalAbsent = totalClasses - totalPresent;
      rate =
        totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

      historyResult = history;
    } else {
      // ── CASE B: Class-wide summary (1 or multiple sessions) ──────
      totalPresent = records.length;
      totalAbsent = sessions.reduce((acc, sess) => {
        const presentInSess = presentMap[sess._id.toString()].size;
        const expected = sess.totalStudents || allStudentsEnrolled.length;
        return acc + Math.max(0, expected - presentInSess);
      }, 0);
      rate =
        totalPresent + totalAbsent > 0
          ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
          : 0;

      if (req.query.sessionId && req.query.sessionId !== "all") {
        // Individual students for that ONE session
        historyResult = history;
      } else {
        // High-level session summaries
        historyResult = sessions.map((sess) => {
          const d = new Date(sess.date);
          const presentCount = presentMap[sess._id.toString()].size;
          const total = sess.totalStudents || allStudentsEnrolled.length;
          const sessionRate =
            total > 0 ? Math.round((presentCount / total) * 100) : 0;

          return {
            _id: sess._id.toString(),
            isSessionRow: true,
            date: d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            time: new Date(sess.lectureStart).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            sessionType: sess.sessionType,
            topic: sess.topic || "",
            presentCount,
            absentCount: Math.max(0, total - presentCount),
            sessionRate,
          };
        });
      }
    }

    // ── Step 5: student list for the filter dropdown (all enrolled) ─────────
    const studentsForFilter = allStudentsEnrolled.map((s) => ({
      _id: s._id,
      name: `${s.firstName} ${s.lastName}`,
      roll: s.rollNumber,
    }));

    res.json({
      history: historyResult,
      summary: {
        totalClasses,
        attended: totalPresent,
        absent: totalAbsent,
        rate,
      },
      students: studentsForFilter,
      sessions: sessions.map((s) => ({
        _id: s._id,
        date: new Date(s.date).toLocaleDateString(),
        type: s.sessionType,
        topic: s.topic,
      })),
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

const getSessionMarkingStudents = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await AttendanceRecord.find({ session: sessionId })
      .populate("student", "firstName lastName rollNumber")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAttendanceRecord = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    const existing = await AttendanceRecord.findOne({
      session: sessionId,
      student: studentId,
    });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    const record = await AttendanceRecord.create({
      session: sessionId,
      student: studentId,
      deviceId: "MANUAL_ENTRY_" + Date.now(),
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeAttendanceRecord = async (req, res) => {
  try {
    const { sessionId, studentId } = req.params;
    await AttendanceRecord.findOneAndDelete({
      session: sessionId,
      student: studentId,
    });
    res.json({ message: "Attendance removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { departmentId, section } = req.query;

    const query = { status: "active" };
    if (departmentId) {
      query.department = departmentId;
    }

    if (section) {
      // For practicals, must match section. For others, show if department matches.
      query.$or = [
        { sessionType: { $ne: "Practical" } },
        { sessionType: "Practical", section: section },
      ];
    }

    const sessions = await AttendanceSession.find(query)
      .populate("subject", "subjectName")
      .populate("teacher", "firstName lastName");

    // Lazy-close all expired sessions found
    const filteredSessions = [];
    for (const sess of sessions) {
      const active = await checkAndCloseIfExpired(sess);
      if (active) {
        const expiresAt = new Date(
          active.createdAt.getTime() + active.duration * 60000,
        );
        const remainingSeconds = Math.max(
          0,
          Math.floor((expiresAt - Date.now()) / 1000),
        );
        filteredSessions.push({ ...active.toObject(), remainingSeconds });
      }
    }

    res.json(filteredSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceScore = async (req, res) => {
  try {
    const { studentId, subjectName } = req.params;

    // 1. Find the subject by name to get its ID
    const Subject = require("../models/Subject.js");
    const subject = await Subject.findOne({ subjectName: subjectName });
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 2. Count total closed sessions for this subject
    const totalSessions = await AttendanceSession.countDocuments({
      subject: subject._id,
      status: "closed",
    });

    if (totalSessions === 0) {
      return res.json({ attendanceScore: 5 }); // Default to 5 if no classes yet
    }

    // 3. Count sessions student attended
    const attendedSessions = await AttendanceRecord.countDocuments({
      student: studentId,
      session: {
        $in: await AttendanceSession.find({
          subject: subject._id,
          status: "closed",
        }).distinct("_id"),
      },
    });

    // 4. Calculate percentage and map to score
    const percentage = (attendedSessions / totalSessions) * 100;
    let score = 2;
    if (percentage >= 75) score = 5;
    else if (percentage >= 50) score = 4;
    else if (percentage >= 20) score = 3;

    res.json({ attendanceScore: score, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startAttendanceSession,
  markAttendance,
  closeAttendanceSession,
  getActiveSessions,
  getActiveTeacherSession,
  getAttendanceHistory,
  getStudentAttendanceHistory,
  getStudentOverallAttendance,
  getAttendanceScore,
  getSessionMarkingStudents,
  addAttendanceRecord,
  removeAttendanceRecord,
};
