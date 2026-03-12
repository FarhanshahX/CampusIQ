const express = require("express");
const { login, StudentLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/student-login", StudentLogin);

module.exports = router;
