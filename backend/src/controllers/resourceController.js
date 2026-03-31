const Resource = require("../models/resource");

exports.createResource = async (req, res) => {
  try {
    const { title, description, subjectId, teacherId } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const Teacher = require("../models/Teacher");
    const teacher = await Teacher.findById(teacherId);

    const resource = await Resource.create({
      title,
      description,
      subjectId,
      teacherId,
      department: teacher ? teacher.department : null,
      fileUrl: `/uploads/resources/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });

    res.status(201).json({
      success: true,
      resource,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getResourcesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { departmentId } = req.query;

    let query = {};
    if (subjectId !== "all") {
      query.subjectId = subjectId;
    } else if (departmentId) {
      query.department = departmentId;
    }

    const resources = await Resource.find(query).sort({
      createdAt: -1,
    });

    res.json(resources);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
