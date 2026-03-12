const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createAdmin,
  createDepartment,
  createTeacher,
  getTeachers,
  getDeptTeachers,
  getDepartment,
} = require("../controllers/adminController");
const {
  createStudent,
  getStudents,
  getStudentbyID,
} = require("../controllers/adminStudentController");

const router = express.Router();

router.post("/CreateAdmin", createAdmin);
router.post(
  "/create-department",
  protect,
  authorize("ADMIN"),
  createDepartment,
);
router.get("/department/:adminID", getDepartment);
router.get("/department/teacher/:deptID", getDeptTeachers);
router.post("/create-teacher", protect, authorize("ADMIN"), createTeacher);
router.get("/teachers", protect, authorize("ADMIN"), getTeachers);
router.post("/create-student", protect, authorize("ADMIN"), createStudent);
router.get("/students", getStudents);
router.get("/students/:studentId", getStudentbyID);

module.exports = router;
