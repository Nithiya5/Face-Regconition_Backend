const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const auth = require('../middlewares/auth');  // Import your custom auth middleware

// Routes

// Register a visitor - Protected route (Admins and employees with canAddVisitor permission)
router.post('/register', auth, visitorController.registerVisitor);

// Get all visitors - Protected route (Only admins can access)
router.get('/all', auth, visitorController.getAllVisitors);

// Get visitors assigned to a specific employee - Protected route (Any authenticated user)
router.get('/employee/:employeeId', auth, visitorController.getVisitorsForEmployee);

// Update a visitor - Protected route (Admins and employees with canAddVisitor permission can update)
router.put('/update/:visitorId', auth, visitorController.updateVisitor);

// Delete a visitor - Protected route (Only admins can delete)
router.delete('/delete/:visitorId', auth, visitorController.deleteVisitor);

module.exports = router;
