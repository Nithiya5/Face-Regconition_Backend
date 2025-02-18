const Employee = require('../models/Employee'); // Assuming Employee model is defined
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Employee login function
const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input data
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }

        // Check if the employee exists in the database
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        // Validate the password
        const validPassword = await bcrypt.compare(password, employee.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid password' });
        }

        // Generate a JWT token for the employee
        const token = jwt.sign(
            { employeeId: employee._id, role: employee.role }, // Include employee ID and role
            'secretJWTkey', // Use an environment variable in production for security
            { expiresIn: '24h' } // Token expiration time
        );

        // Respond with the token
        res.status(200).json({
            msg: 'Login successful',
            token, // Send the token to the client
            employeeId: employee.employeeId, // Send employee ID in response
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

const updateFaceEmbeddings = async (req, res) => {
    try {
      console.log(req.user); // Debugging: Check req.user structure
  
      // 🔍 Find employee using employeeId from req.user
      const employee = await Employee.findById(req.user.employeeId);
  
      if (!employee) {
        return res.status(404).json({ msg: "Employee not found." });
      }
  
      const email = employee.email; // ✅ Get email from found employee
      console.log(email);
  
      const { faceEmbeddings } = req.body;
  
      // ✅ Validate face embeddings format
      let parsedEmbeddings;
      try {
        parsedEmbeddings = JSON.parse(faceEmbeddings.trim());
        if (!Array.isArray(parsedEmbeddings) || parsedEmbeddings.length === 0 || parsedEmbeddings.length > 10) {
          return res.status(400).json({ msg: "Face embeddings must be an array with 1-10 values." });
        }
      } catch (error) {
        return res.status(400).json({ msg: "Invalid face embeddings format." });
      }
  
      // ✅ Update face embeddings in DB
      employee.faceEmbeddings = parsedEmbeddings;
      await employee.save(); // Save changes
  
      res.status(200).json({ msg: "Face embeddings updated successfully." });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  };
  

module.exports = { loginEmployee, updateFaceEmbeddings };
