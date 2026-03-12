const mongoose = require("mongoose");

const subjectScoreSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  subjectID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
  },

  internalTests: {
    type: [Number],
    default: Array(6).fill(0),
  },

  experiments: {
    type: [Number],
    default: Array(10).fill(0),
  },

  assignments: {
    type: [Number],
    default: Array(2).fill(0),
  },

  practicalOral: {
    type: Number,
    default: 0,
  },

  theory: {
    type: Number,
    default: 0,
  },

  // 🔹 Converted totals
  internalTotal: Number, // out of 20
  experimentTotal: Number, // out of 15
  assignmentTotal: Number, // out of 5

  totalMarks: Number, // out of 145

  isLocked: {
    type: Boolean,
    default: false,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SubjectScore", subjectScoreSchema);
