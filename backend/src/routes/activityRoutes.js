const express = require("express");
const multer = require("multer");
const {
  addActivity,
  getActivities,
  deleteActivity,
} = require("../controllers/activityController.js");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/add", upload.single("certificate"), addActivity);
router.get("/:studentId", getActivities);
router.delete("/:id", deleteActivity);

module.exports = router;
