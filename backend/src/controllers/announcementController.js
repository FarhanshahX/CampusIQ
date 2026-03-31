const Announcement = require("../models/Announcement.js");
const Teacher = require("../models/Teacher.js");
const Student = require("../models/Student.js");

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private (Teacher)
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, isImportant, deadline, subjectId, userId } =
      req.body;
    const teacherId = userId;

    let user = await Teacher.findById(userId);
    if (!user) {
      const Admin = require("../models/Admin.js");
      user = await Admin.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const announcementData = {
      title,
      message,
      isImportant,
      teacher: userId,
      department: user.department,
    };

    if (deadline) {
      announcementData.deadline = new Date(deadline);
    }

    // subject is optional based on user feedback
    if (subjectId) {
      announcementData.subject = subjectId;
    }

    const announcement = await Announcement.create(announcementData);

    // Populate teacher info to return alongside the new record
    await announcement.populate("teacher", "firstName lastName");
    if (subjectId) {
      await announcement.populate("subject", "subjectName");
    }

    res.status(201).json({
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements made by the logged-in teacher
// @route   GET /api/announcements/teacher
// @access  Private (Teacher)
const getTeacherAnnouncements = async (req, res) => {
  try {
    const teacherId = req.query.userId;
    const announcements = await Announcement.find({ teacher: teacherId })
      .populate("subject", "subjectName")
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements for a student
// @route   GET /api/announcements/student
// @access  Private (Student)
const getStudentAnnouncements = async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    let query = {};
    if (departmentId) {
      query.department = departmentId;
    }

    const announcements = await Announcement.find(query)
      .populate("subject", "subjectName")
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Teacher)
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.query.userId;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Ensure only the creator can delete it
    if (announcement.teacher.toString() !== teacherId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this announcement" });
    }

    await announcement.deleteOne();
    res.json({ message: "Announcement removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAnnouncement,
  getTeacherAnnouncements,
  getStudentAnnouncements,
  deleteAnnouncement,
};
