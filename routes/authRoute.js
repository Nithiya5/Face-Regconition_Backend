const express = require("express");
const auth = require("../middlewares/auth"); 
const { getUserDetails } = require("../controllers/authController"); 

const router = express.Router();

router.get("/user", auth, getUserDetails);

module.exports = router;
