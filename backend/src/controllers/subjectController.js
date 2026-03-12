const Subject = require("../models/Subject.js");
const Teacher = require("../models/Teacher.js");
const Department = require("../models/Department.js");

const createSubject = async (req, res) => {
  try {
    const {
      subjectName,
      subjectCode,
      semester,
      departmentId,
      subjectType,
      assignedTeacher,
    } = req.body;

    const subject = await Subject.create({
      subjectName,
      subjectCode,
      semester,
      department: departmentId,
      subjectType,
      assignedTeacher,
    });

    await Department.findByIdAndUpdate(departmentId, {
      $push: { subjects: subject._id },
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: "Error creating subject" });
  }
};

const getSubjects = async (req, res) => {
  const { deptID } = req.params;
  console.log("Fetching subjects for department ID:", deptID);
  try {
    const subjects = await Subject.find({
      department: deptID,
    })
      .populate("department", "departmentName") // fetch department name
      .populate("assignedTeacher", "firstName lastName email"); // fetch teacher first/last name and email
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects" });
  }
};

const getSubjectsByTeacher = async (req, res) => {
  const teacherId = req.params.teacherID;
  try {
    const subjects = await Subject.find({ assignedTeacher: teacherId })
      .populate("department", "departmentName")
      .populate("assignedTeacher", "firstName lastName email");
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subjects for teacher" });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectsByTeacher,
};
