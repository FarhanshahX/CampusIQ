const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    default: "ADMIN",
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* Hash password before save */
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

/* Compare password */
adminSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
