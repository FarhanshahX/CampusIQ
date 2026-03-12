const mongoose = require("mongoose");

const preApprovedStudentSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
  },
  officialEmail: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model("PreApprovedStudent", preApprovedStudentSchema);
