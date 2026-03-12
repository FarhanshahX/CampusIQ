const SubjectScore = require("../models/SubjectScore.js");
const Student = require("../models/Student.js");
const mongoose = require("mongoose");

const addOrUpdateScore = async (req, res) => {
  try {
    const {
      studentId,
      subjectID,
      internalTests,
      experiments,
      assignments,
      practical,
      finalExam,
    } = req.body;

    // 🔹 Calculations
    const iaSum = internalTests.reduce((a, b) => a + b, 0);
    const iaTotal = (iaSum / 60) * 20;

    const experimentAvg =
      experiments.reduce((a, b) => a + b, 0) / experiments.length;

    const assignmentAvg =
      assignments.reduce((a, b) => a + b, 0) / assignments.length;

    const overallTotal =
      iaTotal + experimentAvg + assignmentAvg + practical + finalExam;

    const score = await SubjectScore.findOneAndUpdate(
      { student: studentId, subjectID },
      {
        internalTests,
        experiments,
        assignments,
        practical,
        finalExam,
        calculated: {
          iaTotal,
          experimentTotal: experimentAvg,
          assignmentTotal: assignmentAvg,
          overallTotal,
        },
      },
      { upsert: true, new: true },
    );

    res.json(score);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving score" });
  }
};

const updateStudentMarks = async (req, res) => {
  try {
    const { studentId, subjectID, marks } = req.body;

    const student = await Student.findById(studentId);

    // find existing SubjectScore for this student+subject
    let subject = await SubjectScore.findOne({
      student: studentId,
      subjectID,
    });

    // Map frontend field names to backend model field names
    const mappedMarks = {
      internalTests: marks.internalTests,
      experiments: marks.experiments,
      assignments: marks.assignments,
      practical: marks.practicalOral,
      finalExam: marks.theory,
      ...marks,
    };

    if (!subject) {
      subject = new SubjectScore({
        student: studentId,
        subjectID,
        ...mappedMarks,
        lastUpdatedBy: "teacher",
      });
      await subject.save();
    } else {
      if (subject.isLocked)
        return res.status(400).json({ message: "Marks Locked" });

      Object.assign(subject, mappedMarks);
      subject.lastUpdatedBy = "teacher";
      subject.updatedAt = Date.now();
      await subject.save();
    }

    res.json({ message: "Marks Updated Successfully", subject });
  } catch (err) {
    res.status(500).json({ message: "Error updating marks" });
  }
};

// Store lock status per subject (in-memory, can be replaced with DB)
const subjectLockStatus = {};

const lockMarks = async (req, res) => {
  try {
    const { subjectName, isLocked } = req.body;

    // Store lock state per subject
    subjectLockStatus[subjectName] = Boolean(isLocked);

    res.json({
      message: isLocked
        ? `Marks locked for ${subjectName}`
        : `Marks unlocked for ${subjectName}`,
      isLocked: subjectLockStatus[subjectName],
    });
  } catch (err) {
    res.status(500).json({ message: "Error toggling marks lock" });
  }
};

const getMarkLockStatus = async (req, res) => {
  try {
    const { subjectName } = req.params;

    res.json({
      isLocked: subjectLockStatus[subjectName] || false,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching lock status" });
  }
};

const getStudentScores = async (req, res) => {
  console.log("Received request for student scores with params:", req.params);
  try {
    const { studentId, subjectId } = req.params;

    // Find the specific score matching both ID and Subject
    const studentScore = await SubjectScore.findOne({
      student: studentId,
      subjectID: subjectId,
    });

    console.log("Fetched student score:", studentScore);

    if (!studentScore) {
      return res.status(404).json({ message: "Score record not found" });
    }

    // Transform response to match frontend expectations (marks envelope)
    res.json({
      marks: {
        internalTests: studentScore.internalTests || [],
        experiments: studentScore.experiments || [],
        assignments: studentScore.assignments || [],
        practicalOral: studentScore.practicalOral || 0,
        theory: studentScore.theory || 0,
        attendanceScore: studentScore.attendanceScore || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addOrUpdateScore,
  updateStudentMarks,
  lockMarks,
  getMarkLockStatus,
  getStudentScores,
};
