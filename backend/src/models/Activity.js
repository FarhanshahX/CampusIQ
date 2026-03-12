const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  type: {
    type: String,
    enum: [
      "Internship",
      "Value Added Program",
      "Training and Placement Program",
      "Work Experience",
      "Sports",
      "Techfest Prize",
      "Ignite Prize",
      "Extra Activity",
    ],
  },

  title: String,
  organization: String,
  description: String,
  startDate: Date,
  endDate: Date,

  certificateUrl: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Activity", activitySchema);
