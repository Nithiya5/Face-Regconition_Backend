const express = require('express');
const { register, login,registerEmployee,deleteEmployee,viewEmployeeDetails,editEmployee } = require('../controllers/AdminController'); // Import controller
const auth = require('../middlewares/auth');
const router = express.Router();

// Route for registering users (admin, employee, visitor)
router.post('/register', register);

// Route for logging in users (admin, employee, visitor)
router.post('/login', login);

router.post('/registerEmployee',auth,registerEmployee);

router.delete('/deleteEmployee/:employeeId',auth,deleteEmployee);

router.get('/viewEmployeeDetails/:employeeId',auth,viewEmployeeDetails);

router.put('/editEmployee/:employeeId',auth,editEmployee);


module.exports = router;
