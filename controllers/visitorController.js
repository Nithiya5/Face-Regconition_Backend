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
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage }).fields([{ name: 'image', maxCount: 1 }]);

// Register a new visitor
const registerVisitor = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: 'Error uploading profile image' });

      const { visitorId, name, purpose, contactInfo, hostEmployeeId, entryTime, exitTime } = req.body;
      const user = req.user; // Logged-in user

      // Ensure visitor ID is unique
      const existingVisitor = await Visitor.findOne({ visitorId });
      if (existingVisitor) return res.status(400).json({ msg: 'Visitor with this ID already exists.' });

      // Ensure host employee exists
      const hostEmployee = await Employee.findById(hostEmployeeId);
      if (!hostEmployee) return res.status(400).json({ msg: 'Host employee not found.' });

      // Check employee permissions
      if (user.role === 'employee' && !user.canAddVisitor) {
        return res.status(403).json({ msg: 'You do not have permission to add visitors.' });
      }

      // Upload image to Cloudinary
      const cloudinaryResponse = req.files.image ? await cloudinary.uploader.upload(req.files.image[0].path) : null;

      // Create visitor entry
      const newVisitor = new Visitor({
        visitorId,
        name,
        purpose,
        contactInfo,
        hostEmployeeId,
        profileImage: cloudinaryResponse ? cloudinaryResponse.url : null,
        visitHistory: [{
          entryTime: new Date(entryTime),
          exitTime: exitTime ? new Date(exitTime) : null,
        }],
        totalVisits: 1, // First visit
      });

      await newVisitor.save();
      res.status(200).json({ msg: 'Visitor registered successfully.', visitorId: newVisitor.visitorId });
    });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};

// Update visitor visit history
const updateVisitHistory = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { entryTime, exitTime } = req.body;
    const user = req.user;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) return res.status(404).json({ msg: 'Visitor not found.' });

    const hostEmployee = await Employee.findById(visitor.hostEmployeeId);
    if (!hostEmployee) return res.status(400).json({ msg: 'Host employee not found.' });

    // Employees can only update their own visitors
    if (user.role === 'employee' && visitor.hostEmployeeId.toString() !== user._id.toString()) {
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

    const visitors = await Visitor.find().populate('hostEmployeeId', 'name department');
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

    if (user.role !== 'admin' && user._id.toString() !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized: You cannot view other employees’ visitors' });
    }

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

    if (user.role === 'employee' && visitor.hostEmployeeId.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: 'Unauthorized: You can only delete your own visitors.' });
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