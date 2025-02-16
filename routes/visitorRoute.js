const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const auth = require('../middlewares/auth'); // Custom authentication middleware

// Routes for visitor management

// Register a new visitor (Protected route - Admins and employees with permission to add visitors)
router.post('/register', auth, visitorController.registerVisitor);

// Update visit history of a visitor (Protected route - Admins and employees can update their own visitor's history)
router.put('/update/:visitorId', auth, visitorController.updateVisitHistory);

// Get all visitors (Only admins can access this route)
router.get('/all', auth, visitorController.getAllVisitors);

// Get visitors assigned to a specific employee (Employees can only view their own visitors)
router.get('/employee/:employeeId', auth, visitorController.getVisitorsForEmployee);

// Delete a visitor (Protected route - Admins can delete any visitor, Employees can only delete their own visitors)
router.delete('/delete/:visitorId', auth, visitorController.deleteVisitor);

module.exports = router;
