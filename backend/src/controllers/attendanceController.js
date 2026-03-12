// const AttendanceSession = require("../models/AttendanceSession.js");
// const AttendanceRecord = require("../models/AttendanceRecord.js");
// const crypto = require("crypto");

// const startAttendanceSession = async (req, res) => {
//   try {
//     const {
//       subject,
//       department,
//       semester,
//       section,
//       sessionType,
//       lectureStart,
//       lectureEnd,
//       duration,
//       topic,
//       user,
//     } = req.body;

//     const teacherId = user._id;

//     const bluetoothToken = crypto.randomBytes(16).toString("hex");

//     const parseTime = (timeStr) => {
//       const [hours, minutes] = timeStr.split(":");
//       const date = new Date();
//       date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
//       return date;
//     };

//     const session = await AttendanceSession.create({
//       subject,
//       teacher: teacherId,
//       department,
//       semester,
//       section,
//       sessionType,
//       lectureStart: parseTime(lectureStart), // Now a Date object
//       lectureEnd: parseTime(lectureEnd), // Now a Date object
//       duration,
//       topic,
//       bluetoothToken,
//     });

//     res.json({
//       message: "Attendance session started",
//       session,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const markAttendance = async (req, res) => {
//   try {
//     const { bluetoothToken, studentId } = req.body;

//     // const studentId = req.user.id;

//     const session = await AttendanceSession.findOne({
//       bluetoothToken,
//       status: "active",
//     });

//     if (!session) {
//       return res.status(400).json({ message: "Attendance session not active" });
//     }

//     const alreadyMarked = await AttendanceRecord.findOne({
//       session: session._id,
//       student: studentId,
//     });

//     if (alreadyMarked) {
//       return res.status(400).json({ message: "Attendance already marked" });
//     }

//     const record = await AttendanceRecord.create({
//       session: session._id,
//       student: studentId,
//     });

//     res.json({
//       message: "Attendance marked successfully",
//       record,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const closeAttendanceSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     await AttendanceSession.findByIdAndUpdate(sessionId, {
//       status: "closed",
//     });

//     res.json({
//       message: "Attendance session closed",
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const getAttendanceStats = async (req, res) => {
//   try {
//     const { subjectId } = req.params;

//     const stats = await AttendanceRecord.aggregate([
//       {
//         $lookup: {
//           from: "attendancesessions",
//           localField: "session",
//           foreignField: "_id",
//           as: "sessionData",
//         },
//       },
//       { $unwind: "$sessionData" },
//       {
//         $match: {
//           "sessionData.subject": new mongoose.Types.ObjectId(subjectId),
//         },
//       },
//       {
//         $group: {
//           _id: "$student",
//           total: { $sum: 1 },
//         },
//       },
//     ]);

//     res.json(stats);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const getActiveSessions = async (req, res) => {
//   try {
//     const activeSessions = await AttendanceSession.find({ status: "active" })
//       .populate("teacher", "firstName")
//       .populate("subject", "subjectName");
//     res.json(activeSessions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   startAttendanceSession,
//   markAttendance,
//   getAttendanceStats,
//   closeAttendanceSession,
//   getActiveSessions,
// };

const mongoose = require("mongoose");
const crypto = require("crypto");
const AttendanceSession = require("../models/AttendanceSession.js");
const AttendanceRecord = require("../models/AttendanceRecord.js");

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

    console.log(req.body);

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

// ─────────────────────────────────────────────────────────────────────────────
// POST /attendance/mark
// Body: { sessionId, bluetoothToken, deviceId }
// Auth: req.user._id  ← studentId comes from JWT, never from body
// ─────────────────────────────────────────────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { sessionId, bluetoothToken, deviceId } = req.body;

    // studentId from JWT — cannot be spoofed
    const studentId = req.user._id;

    // 1. Validate required fields
    if (!sessionId || !bluetoothToken || !deviceId) {
      return res.status(400).json({
        message: "sessionId, bluetoothToken and deviceId are required.",
      });
    }

    // 2. Find session by ID first, then verify token — avoids a full-collection token scan
    const session = await AttendanceSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.status !== "active") {
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
      // req.user.section should be set when the student logs in
      if (req.user.section && req.user.section !== session.section) {
        return res.status(403).json({
          message: `This session is for Section ${session.section}. You are in Section ${req.user.section}.`,
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /attendance/close/:sessionId
// Auth: teacher only — verify the session belongs to req.user
// ─────────────────────────────────────────────────────────────────────────────
const closeAttendanceSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const teacherId = req.user._id;

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /attendance/active
// Returns active sessions relevant to the requesting user.
//   • Teacher → their own active session(s)
//   • Student → active sessions matching their dept + semester (+ section for Practical)
// Auth: protect middleware sets req.user and req.user.role
// ─────────────────────────────────────────────────────────────────────────────
const getActiveSessions = async (req, res) => {
  try {
    let query = { status: "active" };

    if (req.user.role === "teacher") {
      // Teacher only needs to see their own session
      query.teacher = req.user._id;
    } else {
      // Student — filter by their department and semester
      query.department = req.user.department;
      query.semester = req.user.semester;

      // For Practical sessions, also filter by section so Batch A doesn't
      // see Batch B's session. We want: Lectures (any) OR Practicals for their section.
      // MongoDB $or handles this cleanly.
      query = {
        ...query,
        $or: [
          { sessionType: { $in: ["Lecture", "Extra Class"] } },
          { sessionType: "Practical", section: req.user.section },
        ],
      };
    }

    const sessions = await AttendanceSession.find(query)
      .populate("teacher", "firstName lastName")
      .populate("subject", "subjectName");

    res.json(sessions);
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
    const { subjectId, month, studentId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required." });
    }

    // ── Step 1: find all closed sessions for this subject ──────────────────
    const sessionQuery = {
      subject: new mongoose.Types.ObjectId(subjectId),
      status: "closed",
    };

    if (month) {
      // Filter sessions whose `date` falls in the given month of the current year
      const year = new Date().getFullYear();
      sessionQuery.date = {
        $gte: new Date(year, parseInt(month, 10) - 1, 1),
        $lt: new Date(year, parseInt(month, 10), 1),
      };
    }

    const sessions = await AttendanceSession.find(sessionQuery)
      .populate("subject", "subjectName")
      .sort({ date: -1 });

    if (sessions.length === 0) {
      return res.json({
        history: [],
        summary: { totalClasses: 0, attended: 0, absent: 0, rate: 0 },
        students: [],
      });
    }

    const sessionIds = sessions.map((s) => s._id);

    // ── Step 2: fetch all records for those sessions ───────────────────────
    const recordQuery = { session: { $in: sessionIds } };
    if (studentId) recordQuery.student = new mongoose.Types.ObjectId(studentId);

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
      presentMap[r.session.toString()]?.add(r.student._id.toString());
    });

    // ── Step 3: build history rows ─────────────────────────────────────────
    // For teacher view: one row per (session × student that was enrolled)
    // Since we don't have an enrollment collection here, we show present students
    // + compute absent from session.totalStudents.
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
        studentName: `${r.student?.firstName} ${r.student?.lastName}`,
        studentRoll: r.student?.rollNumber || "",
        status: "PRESENT",
      };
    });

    // ── Step 4: summary ───────────────────────────────────────────────────
    const totalClasses = sessions.length;
    const totalPresent = records.length;
    // totalAbsent = sum over all sessions of (totalStudents - present in that session)
    const totalAbsent = sessions.reduce((acc, sess) => {
      const presentCount = presentMap[sess._id.toString()].size;
      return acc + Math.max(0, (sess.totalStudents || 0) - presentCount);
    }, 0);
    const rate =
      totalClasses > 0
        ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
        : 0;

    // ── Step 5: unique student list for the filter dropdown ────────────────
    const studentMap = {};
    records.forEach((r) => {
      const id = r.student._id.toString();
      if (!studentMap[id]) {
        studentMap[id] = {
          _id: id,
          name: `${r.student.firstName} ${r.student.lastName}`,
          roll: r.student.rollNumber,
        };
      }
    });
    const students = Object.values(studentMap);

    res.json({
      history,
      summary: {
        totalClasses,
        attended: totalPresent,
        absent: totalAbsent,
        rate,
      },
      students,
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
    const { subjectId, month } = req.query;
    const studentId = req.user._id;

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
    if (req.user.section) {
      sessionQuery.$or = [
        { sessionType: { $in: ["Lecture", "Extra Class"] } },
        { sessionType: "Practical", section: req.user.section },
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

module.exports = {
  startAttendanceSession,
  markAttendance,
  closeAttendanceSession,
  getActiveSessions,
  getAttendanceHistory,
  getStudentAttendanceHistory,
};
