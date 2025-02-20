const express = require('express');
const {viewLogs, exportLogs, viewEmployeeLogs, exportEmployeeLogs, getAllAttendanceStats, getAttendanceStats} = require('../controllers/EntrylogController');
const auth = require('../middlewares/auth');
const router = express.Router();


router.get('/admin/logs', auth, viewLogs);
router.get('/admin/logs/export', auth, exportLogs);
router.get('/admin/attendance-stats', auth, getAllAttendanceStats);

router.get('/employee/logs', auth, viewEmployeeLogs);
router.get('/employee/logs/export', auth, exportEmployeeLogs);
router.get('/employee/attendance-stats', auth, getAttendanceStats);


module.exports = router;
