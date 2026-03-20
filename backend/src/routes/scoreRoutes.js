const express = require("express");
const {
  addOrUpdateScore,
  updateStudentMarks,
  lockMarks,
  getMarkLockStatus,
  getStudentScores,
} = require("../controllers/scoreController.js");

const router = express.Router();

router.post("/add", addOrUpdateScore);
router.post("/update", updateStudentMarks);
router.post("/lock/:subjectId", lockMarks);
router.get("/lock/status/:subjectId", getMarkLockStatus);
router.get("/:studentId/:subjectId", getStudentScores);

module.exports = router;
