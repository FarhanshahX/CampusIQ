// const express = require("express");
// const {
//   addActivity,
//   getActivities,
// } = require("../controllers/activityController.js");

// const router = express.Router();

// router.post("/add", addActivity);
// router.get("/:studentId", getActivities);

// module.exports = router;

const express = require("express");
const multer = require("multer");
const {
  addActivity,
  getActivities,
} = require("../controllers/activityController.js");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post("/add", upload.single("certificate"), addActivity);
router.get("/:studentId", getActivities);

module.exports = router;
