const express = require('express');
const {viewLogs, exportLogs, viewEmployeeLogs, exportEmployeeLogs, getAllAttendanceStats, getAttendanceStats} = require('../controllers/EntrylogController'); // Import controller
const auth = require('../middlewares/auth');
const router = express.Router();

// ----------------- Admin Routes ----------------- //
// These endpoints are for admin users to view and export all logs,
// as well as to view overall attendance statistics.

router.get('/admin/logs', auth, viewLogs);
router.get('/admin/logs/export', auth, exportLogs);
router.get('/admin/attendance-stats', auth, getAllAttendanceStats);

// ----------------- Employee Routes ----------------- //
// These endpoints are for employees to view and export their own logs,
// and to view their own attendance statistics.

router.get('/employee/logs', auth, viewEmployeeLogs);
router.get('/employee/logs/export', auth, exportEmployeeLogs);
router.get('/employee/attendance-stats', auth, getAttendanceStats);


module.exports = router;
