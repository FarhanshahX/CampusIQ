const Activity = require("../models/Activity.js");
const cloudinary = require("../config/cloudinary.js");

exports.addActivity = async (req, res) => {
  try {
    let certificateUrl = null;

    // If a certificate file was attached, upload it to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "certificates" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });

      certificateUrl = result.secure_url;
    }

    const activity = await Activity.create({
      ...req.body,
      certificateUrl,
    });

    res.json(activity);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error adding activity" });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      student: req.params.studentId,
    }).sort({ createdAt: -1 });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Error fetching activities" });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Optional: Delete certificate from Cloudinary if it exists
    if (activity.certificateUrl) {
      try {
        // Extract public ID from Cloudinary URL
        // Example: https://res.cloudinary.com/demo/image/upload/v12345/certificates/public_id.jpg
        const parts = activity.certificateUrl.split("/");
        const filename = parts.pop();
        const publicId = `certificates/${filename.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryErr) {
        console.error("Cloudinary deletion failed:", cloudinaryErr);
      }
    }

    await Activity.findByIdAndDelete(id);
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting activity" });
  }
};
