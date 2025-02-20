const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Destination callback called");
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    console.log("Filename callback called:", file.originalname);
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([{ name: 'image', maxCount: 1 }]);

const registerVisitor = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ error: 'Error uploading profile image', details: err.message });
    }

    console.log("Uploaded files:", req.files); 

    try {
      const { visitorId, name, purpose, contactInfo, hostEmployeeId, entryTime, exitTime } = req.body;

      if (!req.files || !req.files.image) {
        return res.status(400).json({ error: "Image is required." });
      }

      const cloudinaryResponse = await cloudinary.uploader.upload(req.files.image[0].path);

      const newVisitor = new Visitor({
        visitorId,
        name,
        purpose,
        contactInfo,
        hostEmployeeId,
        profileImage: cloudinaryResponse.url,
        visitHistory: [{
          entryTime: new Date(entryTime),
          exitTime: exitTime ? new Date(exitTime) : null,
        }],
        totalVisits: 1,
      });

      await newVisitor.save();
      res.status(200).json({ msg: 'Visitor registered successfully.', visitorId: newVisitor.visitorId });
    } catch (error) {
      console.error('Error registering visitor:', error);
      res.status(500).json({ msg: 'Internal Server Error' });
    }
  });
};


const mongoose = require('mongoose');

const updateVisitHistory = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { entryTime, exitTime } = req.body;
    const user = req.user;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) return res.status(404).json({ msg: 'Visitor not found.' });

    const hostEmployee = await Employee.findOne({ employeeId: visitor.hostEmployeeId });
    if (!hostEmployee) return res.status(400).json({ msg: 'Host employee not found.' });

    if (user.role === 'employee' && visitor.hostEmployeeId !== user.employeeId) {
      return res.status(403).json({ msg: 'Unauthorized: You can only update your visitors.' });
    }

    visitor.visitHistory.push({
      entryTime: new Date(entryTime),
      exitTime: exitTime ? new Date(exitTime) : null,
    });

    visitor.totalVisits = visitor.visitHistory.length;
    await visitor.save();

    res.status(200).json({ msg: 'Visitor visit history updated.', totalVisits: visitor.totalVisits });
  } catch (error) {
    console.error('Error updating visit history:', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};


const getAllVisitors = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can view all visitors.' });
    }

    const visitors = await Visitor.find();

    for (let visitor of visitors) {
      const hostEmployee = await Employee.findOne({ employeeId: visitor.hostEmployeeId }, 'name department');
      visitor.hostEmployee = hostEmployee;
    }

    res.status(200).json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};


const getVisitorsForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; 
    const user = req.user; 

    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }

    if (user.role !== 'admin') {
      const employee = await Employee.findById(user.employeeId); 

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      if (employee.employeeId !== employeeId) {
        return res.status(403).json({ error: 'Unauthorized: You cannot view other employees’ visitors' });
      }
    }

    const visitors = await Visitor.find({ hostEmployeeId: employeeId });

    if (!visitors || visitors.length === 0) {
      return res.status(404).json({ error: 'No visitors found for this employee' });
    }

    res.status(200).json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors for employee:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const deleteVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params; 
    const user = req.user; 

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) return res.status(404).json({ msg: 'Visitor not found.' });

    if (user.role === 'employee') {
      const employee = await Employee.findById(user.employeeId); 

      if (!employee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }

      if (visitor.hostEmployeeId !== employee.employeeId) {
        return res.status(403).json({ msg: 'Unauthorized: You can only delete your own visitors.' });
      }
    }

    await Visitor.deleteOne({ visitorId });

    res.status(200).json({ msg: 'Visitor deleted successfully.' });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};


module.exports = {
  registerVisitor,
  updateVisitHistory,
  getAllVisitors,
  getVisitorsForEmployee,
  deleteVisitor,
};