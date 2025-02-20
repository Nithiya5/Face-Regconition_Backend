const express = require('express');
const router = express.Router();
const auth = require("../middlewares/auth");
const { loginEmployee,forgotPassword,resetPassword,updateFaceEmbeddings,markAttendance,viewEmployeeDetails,editEmployeeDetails } = require('../controllers/employeeController'); 

router.post('/login', loginEmployee); 
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword',resetPassword);
router.put('/updateFaceEmbeddings',auth,updateFaceEmbeddings);
router.post('/mark-attendance', auth, markAttendance);
router.get('/viewEmployeeDetails',auth,viewEmployeeDetails);
router.put('/editEmployeeDetails',auth,editEmployeeDetails);

module.exports = router;
