// const mongoose = require("mongoose");

// const attendanceSessionSchema = new mongoose.Schema(
//   {
//     subject: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Subject",
//       required: true,
//     },

//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Teacher",
//       required: true,
//     },

//     department: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Department",
//       required: true,
//     },

//     semester: Number,

//     section: {
//       type: String,
//       enum: ["A", "B", "C", "D"],
//     },

//     sessionType: {
//       type: String,
//       enum: ["Lecture", "Practical", "Extra Class"],
//       default: "Lecture",
//     },

//     lectureStart: Date,
//     lectureEnd: Date,

//     duration: Number, // minutes

//     topic: String,

//     bluetoothToken: {
//       type: String,
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["active", "closed"],
//       default: "active",
//     },
//   },
//   { timestamps: true },
// );

// module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);

const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    // Only required when sessionType is "Practical".
    // No enum here so Mongoose doesn't reject undefined for Lecture/Extra Class sessions.
    section: {
      type: String,
    },

    sessionType: {
      type: String,
      enum: ["Lecture", "Practical", "Extra Class"],
      default: "Lecture",
    },

    // Explicit calendar date of the session (date portion only).
    // Lets history queries filter by date without relying on createdAt.
    date: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },

    // Time stored as Date objects (controller uses parseTime to build these).
    lectureStart: {
      type: Date,
      required: true,
    },
    lectureEnd: {
      type: Date,
      required: true,
    },

    // Bluetooth marking window in minutes (10 / 15 / 20 / 30).
    duration: {
      type: Number,
      required: true,
    },

    topic: {
      type: String,
      default: "",
    },

    // Snapshot of enrolled students at session-start time.
    // Required to compute absent count without a separate enrollment lookup.
    totalStudents: {
      type: Number,
      default: 0,
    },

    // Short-lived random token broadcast over Bluetooth by the teacher's device.
    // Students must present this token when marking attendance.
    bluetoothToken: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
