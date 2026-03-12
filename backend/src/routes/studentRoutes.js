const express = require("express");
const multer = require("multer");
const {
  initiateRegistration,
  completeRegistration,
  getDepartments,
} = require("../controllers/studentController");
const { uploadStudents } = require("../controllers/studentUploadController.js");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// get list of departments for registration dropdown
router.get("/departments", getDepartments);

router.post(
  "/create-student",
  upload.fields([{ name: "studentPhoto", maxCount: 1 }]),
  completeRegistration,
);
router.post("/initiate-registration", initiateRegistration);

router.post("/upload/:departmentId", upload.single("file"), uploadStudents);

module.exports = router;
