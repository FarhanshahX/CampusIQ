const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const activityRoutes = require("./routes/activityRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes.js");
const resourceRoutes = require("./routes/resourceRoutes.js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/resources", resourceRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;
