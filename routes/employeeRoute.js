const express = require('express');
const router = express.Router();
const { loginEmployee,forgotPassword,resetPassword } = require('../controllers/employeeController'); // Import the login function

router.post('/login', loginEmployee); // POST request to /login
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword',resetPassword);

module.exports = router;
