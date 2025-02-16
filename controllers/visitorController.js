const Visitor = require('../models/Visitor');
const Employee = require('../models/Employee'); // Assuming you have an Employee model

// Function to Register a Visitor
const registerVisitor = async (req, res) => {
  try {
    const { visitorId, name, purpose, contactInfo, hostEmployeeId, faceEmbeddings, imageCaptured } = req.body;

    // Check if the visitor already exists (based on unique visitorId)
    const existingVisitor = await Visitor.findOne({ visitorId });
    if (existingVisitor) {
      return res.status(400).json({ msg: 'Visitor with this ID already exists.' });
    }

    // Check if the user is an Admin or Employee
    const user = req.user; // Assuming you have the logged-in user in the request (via JWT or session)

    // Check if the host employee exists (for both Admin and Employee)
    const hostEmployee = await Employee.findById(hostEmployeeId);
    if (!hostEmployee) {
      return res.status(400).json({ msg: 'Host employee not found.' });
    }

    // Check if the logged-in user is an Admin or if it's an Employee with permission to add visitors
    if (user.role === 'employee' && !user.canAddVisitor) {
      return res.status(403).json({ msg: 'You do not have permission to add visitors.' });
    }

    // Create a new visitor record
    const newVisitor = new Visitor({
      visitorId,
      name,
      purpose,
      contactInfo,
      hostEmployeeId,
      faceEmbeddings,
      imageCaptured,
      isLive: false, // Default live status
    });

    // Save the visitor record to the database
    await newVisitor.save();

    res.status(200).json({ msg: 'Visitor registered successfully.', visitor: newVisitor });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ msg: 'Internal Server Error.' });
  }
};

// Function to Get All Visitors (Admin-only functionality)
const getAllVisitors = async (req, res) => {
  try {
    // Ensure the user is an admin before fetching all visitors
    const user = req.user; // Assuming the user is authenticated and their role is in the request

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can view all visitors.' });
    }

    const visitors = await Visitor.find().populate('hostEmployeeId', 'name department');
    res.status(200).json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ msg: 'Internal Server Error.' });
  }
};

// Function to Get Visitors Assigned to a Specific Employee
const getVisitorsForEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; // Get the employee ID from the route params

    const visitors = await Visitor.find({ hostEmployeeId: employeeId });
    res.status(200).json({ visitors });
  } catch (error) {
    console.error('Error fetching visitors for employee:', error);
    res.status(500).json({ msg: 'Internal Server Error.' });
  }
};

// Function to Update Visitor Information (Admin/Employee)
const updateVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { name, purpose, contactInfo, hostEmployeeId, imageCaptured, faceEmbeddings } = req.body;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found.' });
    }

    // Check if the user is allowed to update this visitor (Admin can update any, Employee can only update assigned ones)
    const user = req.user;

    if (user.role === 'employee' && visitor.hostEmployeeId.toString() !== user._id.toString()) {
      return res.status(403).json({ msg: 'You can only update visitors assigned to you.' });
    }

    // Update the visitor fields
    if (name) visitor.name = name;
    if (purpose) visitor.purpose = purpose;
    if (contactInfo) visitor.contactInfo = contactInfo;
    if (hostEmployeeId) visitor.hostEmployeeId = hostEmployeeId;
    if (imageCaptured) visitor.imageCaptured = imageCaptured;
    if (faceEmbeddings) visitor.faceEmbeddings = faceEmbeddings;

    await visitor.save();

    res.status(200).json({ msg: 'Visitor information updated successfully.', visitor });
  } catch (error) {
    console.error('Error updating visitor:', error);
    res.status(500).json({ msg: 'Internal Server Error.' });
  }
};

// Function to Delete a Visitor (Admin only)
const deleteVisitor = async (req, res) => {
  try {
    const { visitorId } = req.params;

    const visitor = await Visitor.findOne({ visitorId });
    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found.' });
    }

    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only admins can delete visitors.' });
    }

    await visitor.remove();

    res.status(200).json({ msg: 'Visitor deleted successfully.' });
  } catch (error) {
    console.error('Error deleting visitor:', error);
    res.status(500).json({ msg: 'Internal Server Error.' });
  }
};

// Export the controller functions
module.exports = {
  registerVisitor,
  getAllVisitors,
  getVisitorsForEmployee,
  updateVisitor,
  deleteVisitor,
};
