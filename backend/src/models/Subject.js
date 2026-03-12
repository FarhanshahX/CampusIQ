const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  subjectType: {
    type: String,
    enum: ["Theory+Lab+Practical", "Theory+Lab", "Theory", "Lab+Practical"],
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  Lock: { type: Boolean, default: false },
});

module.exports = mongoose.model("Subject", subjectSchema);
