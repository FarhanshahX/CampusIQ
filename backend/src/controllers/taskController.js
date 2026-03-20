const Task = require("../models/Task.js");

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Student)
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, studentId } = req.body;

    const task = await Task.create({
      student: studentId,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || "Medium",
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks for a student
// @route   GET /api/tasks/student/:studentId
// @access  Private (Student)
const getStudentTasks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const tasks = await Task.find({ student: studentId }).sort({
      isCompleted: 1, // incomplete first
      dueDate: 1, // closest due date first
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Student)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, isCompleted } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (priority !== undefined) task.priority = priority;
    if (isCompleted !== undefined) task.isCompleted = isCompleted;

    const updatedTask = await task.save();

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Student)
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getStudentTasks,
  updateTask,
  deleteTask,
};
