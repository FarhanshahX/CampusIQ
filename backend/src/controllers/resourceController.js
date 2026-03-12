const Resource = require("../models/resource");

exports.createResource = async (req, res) => {
  console.log("reached here");
  try {
    const { title, description, subjectId, teacherId } = req.body;
    console.log("Received resource creation request: ", req.body);

    const file = req.file;
    console.log("Received file: ", file);

    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    const resource = await Resource.create({
      title,
      description,
      subjectId,
      teacherId,
      fileUrl: `/uploads/resources/${file.filename}`,
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

    const resources = await Resource.find({ subjectId }).sort({
      createdAt: -1,
    });

    res.json(resources);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
