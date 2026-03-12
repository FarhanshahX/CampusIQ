const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  collegeName: {
    type: String,
    default: "Smt. Indira Gandhi College of Engineering",
  },

  degreeType: {
    type: String,
    default: "Bachelors Of Engineering (B.E.)",
  },

  departmentName: {
    type: String,
    enum: [
      "Artificial Intelligence & Data Science",
      "Artificial Intelligence & Machine Learning",
      "Computer Science Engineering",
      "Internet of Things",
      "Electrical Engineering",
      "Mechanical Engineering",
    ],
  },

  departmentYear: {
    type: Number, // 1,2,3,4
  },

  semester: {
    type: Number, // 1-8
  },

  academicBatch: {
    type: String, // "2026-2030"
  },

  shortCode: {
    type: String,
    unique: true,
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },

  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
  ],

  teachers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Department", departmentSchema);
