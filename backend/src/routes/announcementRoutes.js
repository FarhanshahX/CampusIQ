const express = require("express");
const {
  createAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements,
  deleteAnnouncement,
} = require("../controllers/announcementController.js");

const router = express.Router();

router.post("/", createAnnouncement);
router.get("/teacher", getTeacherAnnouncements);
router.get("/student", getStudentAnnouncements);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
