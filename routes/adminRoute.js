const express = require('express');
const { register, login } = require('../controllers/adminController'); // Import controller
const router = express.Router();

// Route for registering users (admin, employee, visitor)
router.post('/register', register);

// Route for logging in users (admin, employee, visitor)
router.post('/login', login);

module.exports = router;
