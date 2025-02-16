const express = require('express');
const router = express.Router();
const { loginEmployee } = require('../controllers/employeeController'); // Import the login function

router.post('/login', loginEmployee); // POST request to /login

module.exports = router;
