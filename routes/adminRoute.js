const express = require('express');
const { register, login,registerEmployee,deleteEmployee,viewEmployeeDetails,editEmployee } = require('../controllers/adminController'); // Import controller
const router = express.Router();

// Route for registering users (admin, employee, visitor)
router.post('/register', register);

// Route for logging in users (admin, employee, visitor)
router.post('/login', login);

router.post('/registerEmployee',registerEmployee);

router.delete('/deleteEmployee/:employeeId',deleteEmployee);

router.get('/viewEmployeeDetails/:employeeId',viewEmployeeDetails);

router.put('/editEmployee/:employeeId',editEmployee)

module.exports = router;
