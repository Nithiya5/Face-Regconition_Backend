const Employee = require('../models/Employee'); // Assuming Employee model is defined
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

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

const nodemailer = require('nodemailer');


const sendPasswordResetEmail = async (email, resetLink, name) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your email
          pass: process.env.EMAIL_PASS  // Your email password or app password
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h3>Hello ${name},</h3>
          <p>We received a request to reset your password. Please click the link below to reset your password:</p>
          <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,</p>
          <p>Admin Team</p>
        `
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
  
  // Forgot Password function
  const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ error: 'Please enter your email address.' });
      }
  
      // Find user by email (can be Admin or Employee)
      const user = await Admin.findOne({ email }) || await Employee.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ error: 'No user found with this email address.' });
      }
  
      // Generate reset token (valid for 1 hour)
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.secretJWTkey, { expiresIn: '1h' });
  
      // Create reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
      // Send the reset password email
      await sendPasswordResetEmail(email, resetLink, user.name);
  
      // Send success response
      res.status(200).json({ message: 'Password reset link has been sent to your email.' });
  
    } catch (err) {
      console.error('Error in forgot-password:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
  
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
  
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }
  
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }
  
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.secretJWTkey);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired token.' });
        }
  
        // Determine whether the user is an Admin or Employee
        let user;
        if (decoded.role === 'Admin') {
            user = await Admin.findById(decoded.id);
        } else if (decoded.role === 'Employee') {
            user = await Employee.findById(decoded.id);
        }
  
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
  
        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);
  
        user.password = hashedPassword;
        await user.save();
  
        res.status(200).json({ message: 'Password has been successfully reset.' });
  
    } catch (err) {
        console.error('Error in reset-password:', err);
        res.status(500).json({ error: 'Internal server error' });
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
  

module.exports = { loginEmployee, updateFaceEmbeddings,forgotPassword,resetPassword };
