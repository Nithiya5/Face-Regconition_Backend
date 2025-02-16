const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');

// Cloudinary Config (Use environment variables in production)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
// });


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
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
}).fields([{ name: 'image', maxCount: 1 }]);

const registerVisitor = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ error: 'Error uploading profile image', details: err.message });
    }

    console.log("Uploaded files:", req.files); // Debugging line

    try {
      const { visitorId, name, purpose, contactInfo, hostEmployeeId, entryTime, exitTime } = req.body;

      if (!req.files || !req.files.image) {
        return res.status(400).json({ error: "Image is required." });
      }

      // Upload image to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(req.files.image[0].path);

      // Save visitor in DB
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


// Update visitor visit history
const mongoose = require('mongoose');

const updateVisitHistory = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { entryTime, exitTime } = req.body;
    const user = req.user;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) return res.status(404).json({ msg: 'Visitor not found.' });

    // Use employeeId instead of _id
    const hostEmployee = await Employee.findOne({ employeeId: visitor.hostEmployeeId });
    if (!hostEmployee) return res.status(400).json({ msg: 'Host employee not found.' });

    // Employees can only update their own visitors
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

// Get all visitors (Admin only)
const getAllVisitors = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can view all visitors.' });
    }

    const visitors = await Visitor.find();

    // Manually populate the employee details using employeeId
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


// Get visitors for an employee (Employees can only view their own visitors)
const getVisitorsForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const user = req.user;

    // Check if the user is an admin or the employee trying to view their own visitors
    if (user.role !== 'admin' && user.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized: You cannot view other employees’ visitors' });
    }

    // Find all visitors where the hostEmployeeId matches the employeeId
    const visitors = await Visitor.find({ hostEmployeeId: employeeId });
    res.status(200).json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors for employee:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Delete a visitor (Employees can only delete their visitors, Admins get notified)
const deleteVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const user = req.user;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) return res.status(404).json({ msg: 'Visitor not found.' });

    // Check if the user is an employee trying to delete their own visitor
    if (user.role === 'employee' && visitor.hostEmployeeId !== user.employeeId) {
      return res.status(403).json({ msg: 'Unauthorized: You can only delete your own visitors.' });
    }

    // Delete the visitor
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