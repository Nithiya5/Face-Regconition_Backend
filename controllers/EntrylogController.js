const EntryLog = require("../models/Entrylog");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const viewLogs = async (req, res) => {
    try {
        const { date, employeeId } = req.query; 

        let filter = {};

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.entryTime = { $gte: start, $lte: end };
        }
        if (employeeId) filter.employeeId = employeeId;

        const logs = await EntryLog.find(filter).sort({ entryTime: -1 });

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const exportLogs = async (req, res) => {
    try {
        const logs = await EntryLog.find().lean(); 

        if (!logs.length) return res.status(404).json({ msg: "No logs found!" });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Entry Logs");

        worksheet.columns = [
            { header: "Employee ID", key: "employeeId", width: 15 },
            { header: "Entry Time", key: "entryTime", width: 25 },
            { header: "Exit Time", key: "exitTime", width: 25 },
            { header: "Device ID", key: "deviceId", width: 20 },
            { header: "Location", key: "location", width: 20 },
            { header: "Is Live", key: "isLive", width: 10 },
            { header: "Spoof Attempt", key: "spoofAttempt", width: 15 },
        ];

        logs.forEach(log => worksheet.addRow(log));

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

        const { date } = req.query; 
        let filter = { employeeId };

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.entryTime = { $gte: start, $lte: end };
        }

        const logs = await EntryLog.find(filter).sort({ entryTime: -1 });

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const exportEmployeeLogs = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;

        if (!employeeId) return res.status(403).json({ msg: "Unauthorized" });

        const logs = await EntryLog.find({ employeeId }).lean();

        if (!logs.length) return res.status(404).json({ msg: "No logs found!" });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("My Entry Logs");

        worksheet.columns = [
            { header: "Employee ID", key: "employeeId", width: 15 },
            { header: "Entry Time", key: "entryTime", width: 25 },
            { header: "Exit Time", key: "exitTime", width: 25 },
            { header: "Device ID", key: "deviceId", width: 20 },
            { header: "Location", key: "location", width: 20 },
            { header: "Is Live", key: "isLive", width: 10 },
            { header: "Spoof Attempt", key: "spoofAttempt", width: 15 },
        ];

        logs.forEach(log => worksheet.addRow(log));

        const filePath = path.join(__dirname, `../exports/logs_${employeeId}.xlsx`);
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, `logs_${employeeId}.xlsx`, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error("Error exporting logs:", error);
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
        const logs = await EntryLog.find({}).lean();
        if (!logs.length) {
            return res.status(404).json({ msg: "No attendance records found." });
        }

        const statsMap = {};

        logs.forEach(log => {
            const day = log.entryTime.toISOString().split("T")[0];
            if (!statsMap[log.employeeId]) {
                statsMap[log.employeeId] = {
                    employeeId: log.employeeId,
                    presentDaysSet: new Set(),
                    earliest: log.entryTime
                };
            }
            statsMap[log.employeeId].presentDaysSet.add(day);
            if (log.entryTime < statsMap[log.employeeId].earliest) {
                statsMap[log.employeeId].earliest = log.entryTime;
            }
        });

        const today = new Date();
        const stats = [];

        for (const employeeId in statsMap) {
            const record = statsMap[employeeId];
            const presentDays = record.presentDaysSet.size;
    
            const totalDays = getBusinessDays(record.earliest, today);
            const absentDays = totalDays - presentDays;
            const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

            stats.push({
                employeeId,
                presentDays,
                totalDays,
                absentDays,
                attendancePercentage: `${attendancePercentage}%`
            });
        }

        if (req.query.export === "true") {
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

            const filePath = path.join(__dirname, "../exports/attendance_stats.xlsx");
            await workbook.xlsx.writeFile(filePath);
            return res.download(filePath, "attendance_stats.xlsx", () => fs.unlinkSync(filePath));
        } else {
            res.status(200).json(stats);
        }
    } catch (error) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const getAttendanceStats = async (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(403).json({ msg: "Unauthorized" });
        }

        const logs = await EntryLog.find({ employeeId });
        if (!logs.length) {
            return res.status(404).json({ msg: "No attendance records found!" });
        }

        const presentDaysSet = new Set(logs.map(log => log.entryTime.toISOString().split("T")[0]));
        const earliest = logs.reduce((min, log) => (log.entryTime < min ? log.entryTime : min), logs[0].entryTime);
        const today = new Date();

        const totalDays = getBusinessDays(earliest, today);
        const presentDays = presentDaysSet.size;
        const absentDays = totalDays - presentDays;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : "0.00";

        res.status(200).json({
            totalBusinessDays: totalDays,
            presentDays,
            absentDays,
            attendancePercentage: `${attendancePercentage}%`,
        });
    } catch (error) {
        console.error("Error calculating attendance stats:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};



module.exports = { viewLogs, exportLogs, viewEmployeeLogs, exportEmployeeLogs, getAllAttendanceStats, getAttendanceStats };

