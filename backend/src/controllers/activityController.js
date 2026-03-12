// import Activity from "../models/Activity.js";

// export const addActivity = async (req, res) => {
//   try {
//     const activity = await Activity.create(req.body);
//     console.log(req.body);
//     res.json(activity);
//   } catch (err) {
//     res.status(500).json({ message: "Error adding activity" });
//   }
// };

// export const getActivities = async (req, res) => {
//   try {
//     const activities = await Activity.find({
//       student: req.params.studentId,
//     }).sort({ createdAt: -1 });

//     res.json(activities);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching activities" });
//   }
// };

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
