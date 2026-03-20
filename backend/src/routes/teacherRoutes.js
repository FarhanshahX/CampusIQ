const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "src/uploads/" });

// const { protect } = require("../middleware/authMiddleware");
const {
  updateTeacherProfile,
  getTeacherAnalytics,
  getMarksTemplate,
  uploadMarks,
} = require("../controllers/teacherController");

router.put("/profile", updateTeacherProfile);
router.get("/analytics/:teacherId/:subjectId", getTeacherAnalytics);
router.get("/template/:subjectId", getMarksTemplate);
router.post("/upload-marks", upload.single("file"), uploadMarks);

module.exports = router;
