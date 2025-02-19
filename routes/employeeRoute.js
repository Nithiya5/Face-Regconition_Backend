const express = require('express');
const router = express.Router();
const auth = require("../middlewares/auth");
const { loginEmployee,forgotPassword,resetPassword,updateFaceEmbeddings } = require('../controllers/employeeController'); // Import the login function

router.post('/login', loginEmployee); // POST request to /login
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword',resetPassword);
router.put('/updateFaceEmbeddings',auth,updateFaceEmbeddings);

module.exports = router;
