// const mongoose = require("mongoose");

// const attendanceRecordSchema = new mongoose.Schema(
//   {
//     session: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AttendanceSession",
//       required: true,
//     },

//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Student",
//       required: true,
//     },

//     markedAt: {
//       type: Date,
//       default: Date.now,
//     },

//     status: {
//       type: String,
//       enum: ["present"],
//       default: "present",
//     },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);

const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // Hardware/device fingerprint sent from the student's app at mark-time.
    // Used to enforce one-device-one-attendance proxy prevention.
    // Store a hashed fingerprint (e.g. SHA-256 of device ID) — never raw.
    deviceId: {
      type: String,
      required: true,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },

    // "present" is the only status stored as a record.
    // Absent students simply have no record for a given session.
    // The /attendance/history endpoint computes absences as:
    //   absent = session.totalStudents - (count of records for that session)
    status: {
      type: String,
      enum: ["present"],
      default: "present",
    },
  },
  { timestamps: true },
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Enforces one record per student per session at the database level.
// This is the primary guard against duplicate marking.
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

// Enforces one device per session — the core proxy-prevention constraint.
// If student A's device ID is already in a record for this session,
// no other student can submit the same device for the same session.
attendanceRecordSchema.index({ session: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
