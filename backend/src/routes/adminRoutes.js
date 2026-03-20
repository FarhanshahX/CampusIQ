const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createAdmin,
  createDepartment,
  createTeacher,
  getTeachers,
  getDeptTeachers,
  getDepartment,
  getTeacherById,
  incrementSemester,
  editDepartment,
  getAdminAttendanceOverview,
  getAdminAnalytics,
  getTeacherBySubjectId,
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
router.patch("/department/:adminID/increment-semester", incrementSemester);
router.patch("/department/:adminID/edit", editDepartment);
router.get("/department/teacher/:deptID", getDeptTeachers);
router.post("/create-teacher", protect, authorize("ADMIN"), createTeacher);
router.get("/teachers", protect, authorize("ADMIN"), getTeachers);
router.get("/teachers/:teacherId", getTeacherById);
router.post("/create-student", protect, authorize("ADMIN"), createStudent);
router.get("/students", getStudents);
router.get("/students/:studentId", getStudentbyID);
router.get("/attendance-overview/:adminID", getAdminAttendanceOverview);
router.get("/analytics/:adminID", getAdminAnalytics);
router.get("/teacher/:subjectId", getTeacherBySubjectId);

module.exports = router;
