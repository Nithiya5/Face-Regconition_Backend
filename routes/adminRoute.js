const express = require('express');
const { register, login,registerEmployee,deleteEmployee,viewEmployeeDetails,editEmployee,getAllEmployees } = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/registerEmployee',auth,registerEmployee);

router.delete('/deleteEmployee/:employeeId',auth,deleteEmployee);

router.get('/viewEmployeeDetails/:employeeId',auth,viewEmployeeDetails);

router.put('/editEmployee/:employeeId',auth,editEmployee);

router.get('/getAllEmployees',auth,getAllEmployees);


module.exports = router;
