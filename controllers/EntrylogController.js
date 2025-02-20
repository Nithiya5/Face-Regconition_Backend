const EntryLog = require("../models/Entrylog");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const viewLogs = async (req, res) => {
    try {
        const { date, employeeId, page = 1, limit = 10 } = req.query; 
        let filter = {};

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.entryTime = { $gte: start, $lte: end };
        }
        if (employeeId) filter.employeeId = employeeId;

        const logs = await EntryLog.find(filter)
            .sort({ entryTime: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .select("employeeId entryTime exitTime deviceId location isLive spoofAttempt")
            .lean();

        res.status(200).json({ logs, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const exportLogs = async (req, res) => {
    try {
        const logs = await EntryLog.find().sort({ employeeId: 1, entryTime: 1 }).lean();

        if (!logs.length) return res.status(404).json({ msg: "No logs found!" });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Entry Logs");

        worksheet.columns = [
            { header: "Employee ID", key: "employeeId", width: 15 },
            { header: "Date", key: "date", width: 15 },
            { header: "Entry Time", key: "entryTime", width: 20 },
            { header: "Exit Time", key: "exitTime", width: 20 },
            { header: "Device ID", key: "deviceId", width: 15 },
            { header: "Latitude", key: "latitude", width: 15 },
            { header: "Longitude", key: "longitude", width: 15 },
            { header: "Is Live", key: "isLive", width: 10 },
            { header: "Spoof Attempt", key: "spoofAttempt", width: 15 },
        ];

        logs.forEach(log => {
            worksheet.addRow({
                employeeId: log.employeeId,
                date: log.entryTime.toISOString().split("T")[0], 
                entryTime: log.entryTime.toLocaleString(), 
                exitTime: log.exitTime ? log.exitTime.toLocaleString() : "Not Checked Out", 
                deviceId: log.deviceId || "N/A",
                latitude: log.location?.coordinates[1] || "N/A",
                longitude: log.location?.coordinates[0] || "N/A",
                isLive: log.isLive ? "Yes" : "No",
                spoofAttempt: log.spoofAttempt ? "Yes" : "No",
            });
        });

        const filePath = path.join(__dirname, "../exports/logs.xlsx");
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, "logs.xlsx", () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error("Error exporting logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const viewEmployeeLogs = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) return res.status(403).json({ msg: "Unauthorized" });

        const { date, page = 1, limit = 10 } = req.query;
        let filter = { employeeId };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.entryTime = { $gte: start, $lte: end };
        }

        const logs = await EntryLog.find(filter)
            .sort({ entryTime: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .select("entryTime exitTime deviceId location isLive spoofAttempt")
            .lean();

        res.status(200).json({ logs, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const exportEmployeeLogs = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;

        if (!employeeId) return res.status(403).json({ msg: "Unauthorized" });

        const logs = await EntryLog.find({ employeeId }).sort({ entryTime: 1 }).lean();

        if (!logs.length) return res.status(404).json({ msg: "No logs found!" });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Logs - ${employeeId}`);

        worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Entry Time", key: "entryTime", width: 20 },
            { header: "Exit Time", key: "exitTime", width: 20 },
            { header: "Device ID", key: "deviceId", width: 15 },
            { header: "Latitude", key: "latitude", width: 15 },
            { header: "Longitude", key: "longitude", width: 15 },
            { header: "Is Live", key: "isLive", width: 10 },
            { header: "Spoof Attempt", key: "spoofAttempt", width: 15 },
        ];

        logs.forEach(log => {
            worksheet.addRow({
                date: log.entryTime.toISOString().split("T")[0],
                entryTime: log.entryTime.toLocaleString(),
                exitTime: log.exitTime ? log.exitTime.toLocaleString() : "Not Checked Out", 
                deviceId: log.deviceId || "N/A",
                latitude: log.location?.coordinates[1] || "N/A",
                longitude: log.location?.coordinates[0] || "N/A",
                isLive: log.isLive ? "Yes" : "No",
                spoofAttempt: log.spoofAttempt ? "Yes" : "No",
            });
        });

        const filePath = path.join(__dirname, `../exports/logs_${employeeId}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, `logs_${employeeId}.xlsx`, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error("Error exporting employee logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const getBusinessDays = (startDate, endDate) => {
    let count = 0;
    let curDate = new Date(startDate);
    curDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDate);
    endDate.setHours(0, 0, 0, 0);
  
    while (curDate <= endDate) {
        const day = curDate.getDay();
        if (day !== 0 && day !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};


const getAllAttendanceStats = async (req, res) => {
    try {
        const today = new Date();

        const firstLogs = await EntryLog.aggregate([
            { $sort: { entryTime: 1 } },
            { $group: { _id: "$employeeId", firstEntry: { $first: "$entryTime" } } }
        ]);

        if (!firstLogs.length) return res.status(404).json({ msg: "No attendance records found." });

        const attendanceCounts = await EntryLog.aggregate([
            { 
                $group: { 
                    _id: { employeeId: "$employeeId", date: { $dateToString: { format: "%Y-%m-%d", date: "$entryTime" } } }
                }
            },
            { 
                $group: { 
                    _id: "$_id.employeeId", 
                    presentDays: { $sum: 1 } 
                }
            }
        ]);

        const attendanceMap = {};
        attendanceCounts.forEach(record => {
            attendanceMap[record._id] = record.presentDays;
        });

        const stats = firstLogs.map(record => {
            const employeeId = record._id;
            const presentDays = attendanceMap[employeeId] || 0;
            const totalDays = getBusinessDays(record.firstEntry, today);
            const absentDays = totalDays - presentDays;
            const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

            return { employeeId, presentDays, totalDays, absentDays, attendancePercentage: `${attendancePercentage}%` };
        });

        if (req.query.export === "true") {
            const exportDir = path.join(__dirname, "../exports");
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });  
            }

            const filePath = path.join(exportDir, "attendance_stats.xlsx");
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Attendance Stats");

            worksheet.columns = [
                { header: "Employee ID", key: "employeeId", width: 15 },
                { header: "Present Days", key: "presentDays", width: 15 },
                { header: "Total Business Days", key: "totalDays", width: 20 },
                { header: "Absent Days", key: "absentDays", width: 15 },
                { header: "Attendance %", key: "attendancePercentage", width: 15 },
            ];

            stats.forEach(stat => worksheet.addRow(stat));

            await workbook.xlsx.writeFile(filePath);
            return res.download(filePath, "attendance_stats.xlsx", (err) => {
                if (err) {
                    console.error("Download error:", err);
                }
                fs.unlinkSync(filePath); 
            });
        }

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


const getAttendanceStats = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) return res.status(403).json({ msg: "Unauthorized" });

        const today = new Date();
        const firstLog = await EntryLog.findOne({ employeeId }).sort({ entryTime: 1 }).select("entryTime").lean();
        if (!firstLog) return res.status(404).json({ msg: "No attendance records found!" });

        const totalDays = getBusinessDays(firstLog.entryTime, today);
        const presentDays = await EntryLog.aggregate([
            { $match: { employeeId } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$entryTime" } } } }
        ]);

        const absentDays = totalDays - presentDays.length;
        const attendancePercentage = totalDays > 0 ? ((presentDays.length / totalDays) * 100).toFixed(2) : "0.00";

        const stats = {
            employeeId,
            totalBusinessDays: totalDays,
            presentDays: presentDays.length,
            absentDays,
            attendancePercentage: `${attendancePercentage}%`,
        };

        if (req.query.export === "true") {
            const exportDir = path.join(__dirname, "../exports");
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });  // Ensure folder exists
            }

            const filePath = path.join(exportDir, `attendance_stats_${employeeId}.xlsx`);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Attendance Stats");

            worksheet.columns = [
                { header: "Employee ID", key: "employeeId", width: 15 },
                { header: "Total Business Days", key: "totalBusinessDays", width: 20 },
                { header: "Present Days", key: "presentDays", width: 15 },
                { header: "Absent Days", key: "absentDays", width: 15 },
                { header: "Attendance %", key: "attendancePercentage", width: 15 },
            ];

            worksheet.addRow(stats);

            await workbook.xlsx.writeFile(filePath);
            return res.download(filePath, `attendance_stats_${employeeId}.xlsx`, (err) => {
                if (err) {
                    console.error("Download error:", err);
                }
                fs.unlinkSync(filePath); // Delete file after download
            });
        }

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error calculating attendance stats:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

module.exports = { viewLogs, exportLogs, viewEmployeeLogs, exportEmployeeLogs, getAllAttendanceStats, getAttendanceStats };

