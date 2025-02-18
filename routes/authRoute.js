const express = require("express");
const auth = require("../middlewares/auth"); // Ensure correct path
const { getUserDetails } = require("../controllers/authController"); // Import the controller

const router = express.Router();

// Route to get user details (protected)
router.get("/user", auth, getUserDetails);

module.exports = router;
