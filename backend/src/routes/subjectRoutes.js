const express = require("express");
const {
  createSubject,
  getSubjects,
  getSubjectsByTeacher,
} = require("../controllers/subjectController.js");

const router = express.Router();

router.post("/create", createSubject);
router.get("/:deptID", getSubjects);
router.get("/teacher/:teacherID", getSubjectsByTeacher);

module.exports = router;
