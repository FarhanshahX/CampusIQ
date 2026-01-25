// const User = require("../models/User");
const Teacher = require("../models/Teacher");
const generateToken = require("../utils/generateToken");

/* LOGIN */
const Login = async (req, res) => {
  const { email, role, password } = req.body;
  console.log(email, role, password);
  try {
    const user = await Teacher.findOne({ email, role });
    const result = await user.matchPassword(password);
    console.log("Password match result:", result);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = Login;
