const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const auth = require('../middlewares/auth');

router.post('/register', auth, visitorController.registerVisitor);
router.put('/update/:visitorId', auth, visitorController.updateVisitHistory);
router.get('/all', auth, visitorController.getAllVisitors);
router.get('/employee/:employeeId', auth, visitorController.getVisitorsForEmployee);
router.delete('/delete/:visitorId', auth, visitorController.deleteVisitor);

module.exports = router;
