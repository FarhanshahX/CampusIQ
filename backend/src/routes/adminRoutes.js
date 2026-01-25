const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createTeacher,
  getTeachers,
} = require("../controllers/adminController");
const {
  createStudent,
  getStudents,
} = require("../controllers/adminStudentController");

const router = express.Router();

router.post("/create-teacher", protect, authorize("ADMIN"), createTeacher);
router.get("/teachers", protect, authorize("ADMIN"), getTeachers);
router.post("/create-student", protect, authorize("ADMIN"), createStudent);
router.get("/students", protect, authorize("ADMIN"), getStudents);

module.exports = router;
