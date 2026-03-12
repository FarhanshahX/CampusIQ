const express = require("express");
const router = express.Router();

const resourceController = require("../controllers/resourceController");
const upload = require("../middleware/upload");

router.post(
  "/create",
  upload.single("file"),
  resourceController.createResource,
);

router.get("/subject/:subjectId", resourceController.getResourcesBySubject);

module.exports = router;
