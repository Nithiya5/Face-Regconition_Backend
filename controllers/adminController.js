const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register Admin, Employee, or Visitor
const register = async (req, res) => {
    try {
        const { username, email, password, role, fullName } = req.body;

        // Validate input data
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        // Check if the user already exists
        const exists = await Admin.findOne({ email });
        if (exists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new admin/employee/visitor
        const newUser = new Admin({
            username,
            email,
            password: hashedPassword,
            role: role || 'employee', // Default to 'employee' if no role is provided
            fullName
        });

        await newUser.save();
        res.status(200).json({ msg: 'User registered successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
};

// Login Function for Admin, Employee, or Visitor
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input data
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }

        // Check if the user exists
        const user = await Admin.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Validate the password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid Password' });
        }

        // Generate JWT token with user ID and role
        const token = jwt.sign(
            { userId: user._id, role: user.role }, // Include user ID and role in the token
            'secretJWTkey', // JWT secret key (change this to an environment variable in production)
            { expiresIn: '24h' }
        );

        res.status(200).json({ token }); // Send back the token
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
};


const cloudinary = require('cloudinary').v2;
const multer = require('multer'); // Import multer for file uploads
const Employee = require('../models/Employee'); // Assuming you have an Employee model

// Initialize Cloudinary
cloudinary.config({
  cloud_name: 'djxbzcayc',
  api_key: '177435834375344',
  api_secret: 'VC8o4lQSa551ADbsUtPtV3jIaO4', // Cloudinary API secret (store it in env variables in production)
});

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Temporary storage location
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Save with unique name
  },
});

// Use `.fields()` to accept both file and text fields
const upload = multer({ storage: storage }).fields([
  { name: 'image', maxCount: 1 }, // Profile image
  { name: 'faceEmbeddings' }, // Ensures `faceEmbeddings` is processed correctly
]);

const nodemailer = require('nodemailer');

const registerEmployee = async (req, res) => {
  try {
    // Multer upload middleware
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error uploading profile image' });
      }

      try {
        // Extract fields after multer has processed the form-data
        const { employeeId, name, department, designation, email, phone, password, canAddVisitor } = req.body;

        let faceEmbeddings = [];

        // Ensure faceEmbeddings is properly parsed
        if (req.body.faceEmbeddings) {
          try {
            faceEmbeddings = JSON.parse(req.body.faceEmbeddings.trim());
          } catch (error) {
            return res.status(400).json({ msg: "Invalid face embeddings format. Must be a valid JSON array." });
          }
        }

        console.log("Parsed faceEmbeddings:", faceEmbeddings); // Debugging step

        if (!Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0 || faceEmbeddings.length > 10) {
          return res.status(400).json({ msg: "Face embeddings must be an array with 1-10 values." });
        }

        // Check if email, employeeId, or phone already exist in the database
        const existingEmployee = await Employee.findOne({
          $or: [{ email }, { employeeId }, { phone }]
        });

        if (existingEmployee) {
          return res.status(400).json({ msg: "Employee ID, Email, or Phone already exists." });
        }

        // Hash the password for storing in the database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload the profile image to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(req.files.image[0].path);

        // Create a new employee record
        const newEmployee = new Employee({
          employeeId,
          name,
          department,
          designation,
          email,
          phone,
          password: hashedPassword,
          faceEmbeddings,
          canAddVisitor: canAddVisitor || false, // Default to false if not provided
          profileImage: cloudinaryResponse.url, // Store Cloudinary image URL in the database
        });

        await newEmployee.save(); // Save the employee record

        // Send email with login details
        sendEmail(email, password, name);

        // Respond with success
        res.status(200).json({
          msg: 'Employee registered successfully. Login details sent via email.',
          profileImageUrl: cloudinaryResponse.url,
          employeeId: newEmployee.employeeId
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal Server Error' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};


// Function to send email using Nodemailer
const sendEmail = async (email, password, name) => {
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
      subject: 'Your Employee Account Has Been Created',
      html: `
        <h3>Hello ${name},</h3>
        <p>Your employee account has been successfully created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please log in and change your password immediately.</p>
        <p>Best regards,</p>
        <p>Admin Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



module.exports = { register,registerEmployee, login };
