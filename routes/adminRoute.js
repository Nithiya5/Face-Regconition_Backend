const express = require('express');
const { register, login,registerEmployee,editEmployee,viewEmployeeDetails } = require('../controllers/adminController'); // Import controller
const router = express.Router();

// Route for registering users (admin, employee, visitor)
router.post('/register', register);

// Route for logging in users (admin, employee, visitor)
router.post('/login', login);

router.post('/registerEmployee',registerEmployee);
router.put('/editEmployee/:employeeId', editEmployee);
router.get('/viewEmployee/:employeeId', viewEmployeeDetails);


module.exports = router;
