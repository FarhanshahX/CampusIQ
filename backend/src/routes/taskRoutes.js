const express = require("express");
const {
  createTask,
  getStudentTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController.js");

const router = express.Router();

router.post("/", createTask);
router.get("/student/:studentId", getStudentTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
