const cloudinary = require('cloudinary').v2;
const multer = require('multer'); // Import multer for file uploads
 // Assuming you have an Employee model
 const Employee = require('../models/Employee');
 const Admin = require('../models/Admin');
 const nodemailer = require('nodemailer');
 const jwt = require('jsonwebtoken');


 const fs = require('fs');
 const faceapi = require('face-api.js');
 const canvas = require('canvas');
 const { Canvas, Image, ImageData } = canvas;
 faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
 
 // Cloudinary configuration
 cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET, // Cloudinary API secret (store it in env variables in production)
 });
 
//  Multer setup for handling file uploads
 const storage = multer.diskStorage({
   destination: function (req, file, cb) {
     cb(null, 'uploads/'); // Temporary storage location
   },
   filename: function (req, file, cb) {
     cb(null, Date.now() + '-' + file.originalname); // Save with unique name
   },
 });


 // Use .fields() to accept both file and text fields
 const upload = multer({ storage: storage }).fields([
   { name: 'image', maxCount: 1 }, // Profile image
   { name: 'faceEmbeddings' }, // Ensures faceEmbeddings is processed correctly
 ]);
 
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB size limit (adjust based on your needs)
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = filetypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed'));
//     }
//   },
// }).fields([
//   { name: 'image', maxCount: 1 }, // Profile image
//   { name: 'faceEmbeddings' } // If you expect this field to contain face embeddings
// ]);

 // Process images and extract face embeddings using face-api.js
 const processImages = async (imageBuffers) => {
   // Load face-api.js models
   await faceapi.nets.ssdMobilenetv1.loadFromDisk('./modules');
   await faceapi.nets.faceLandmark68Net.loadFromDisk('./modules');
   await faceapi.nets.faceRecognitionNet.loadFromDisk('./modules');
 
   const faceEmbeddings = [];
 
   for (const buffer of imageBuffers) {
     const image = await canvas.loadImage(buffer);
     const detections = await faceapi.detectSingleFace(image)
       .withFaceLandmarks()
       .withFaceDescriptor();
 
     if (detections && detections.descriptor) {
       const descriptorArray = Array.from(detections.descriptor);
       faceEmbeddings.push(descriptorArray);
     } else {
       throw new Error('No face detected in one of the images.');
     }
   }
 
   return faceEmbeddings;
 };

 const register = async (req, res) => {
  try {
      const { username, email, password, fullName } = req.body;

      // Validate input data
      if (!username || !email || !password || !fullName) {
          return res.status(400).json({ msg: 'All fields are required' });
      }

      // Check if the email already exists in either Admin or Employee collection
      const adminExists = await Admin.findOne({ email });
      const employeeExists = await Employee.findOne({ email });

      if (adminExists || employeeExists) {
          return res.status(400).json({ msg: 'Email already exists in Admin or Employee database' });
      }

      // Hash the password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new admin
      const newUser = new Admin({
          username,
          email,
          password: hashedPassword,
          fullName
      });

      await newUser.save();
      res.status(200).json({ msg: 'Admin registered successfully' });
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
 // Assuming you have an Employee model

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Cloudinary API secret (store it in env variables in production)
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

// Use .fields() to accept both file and text fields
const upload = multer({ storage: storage }).fields([
  { name: 'image', maxCount: 1 }, // Profile image
  { name: 'faceEmbeddings' }, // Ensures faceEmbeddings is processed correctly
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
        console.log(department);
        console.log(name);
        let faceEmbeddings = [];
        


        // Ensure faceEmbeddings is properly parsed
        if (req.body.faceEmbeddings) {
          try {
            // Parse the faceEmbeddings as an array of arrays
            faceEmbeddings = JSON.parse(req.body.faceEmbeddings.trim());
          } catch (error) {
            return res.status(400).json({ msg: "Invalid face embeddings format. Must be a valid JSON array of arrays." });
          }
        }

        // console.log("Parsed faceEmbeddings:", faceEmbeddings); // Debugging step

        // Ensure faceEmbeddings length is between 1 and 10
        if (faceEmbeddings.length === 0 || faceEmbeddings.length > 10) {
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
          faceEmbeddings,  // Storing the parsed and validated face embeddings
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
  <p>Before you can start tracking your attendance, we need you to provide your face embeddings for identification. This will enable the system to recognize you for attendance purposes.</p>
  <p>To do this, please log in and submit your face embeddings in your profile settings.</p>
  <p>If you have any questions or face issues, feel free to reach out to the Admin Team.</p>
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

// Function to send the reset email
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
const forgotAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }

    // Find employee by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: 'No Admin found with this email address.' });
    }

    // Generate reset token (valid for 1 hour)
    const token = jwt.sign({ id: admin._id }, process.env.secretJWTkey, { expiresIn: '1h' });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Send the reset password email
    await sendPasswordResetEmail(email, resetLink, admin.name);

    // Send success response
    res.status(200).json({ message: 'Password reset link has been sent to your email.' });

  } catch (err) {
    console.error('Error in forgot-password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const resetAdminPassword = async (req, res) => {
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

      const admin = await Admin.findById(decoded.id);
      if (!admin) {
          return res.status(404).json({ error: 'Admin not found.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      admin.password = hashedPassword;
      await admin.save();

      res.status(200).json({ message: 'Password has been successfully reset.' });

  } catch (err) {
      console.error('Error in reset-admin-password:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
};


const editEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, department, designation, email, phone, canAddVisitor } = req.body;

    // Check if the employee exists
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    // Check if email or phone already exists for another employee
    const existingUser = await Employee.findOne({
      $or: [{ email }, { phone }],
      _id: { $ne: employee._id }, // Exclude the current employee's ID
    });

    if (existingUser) {
      return res.status(400).json({ msg: "Email or phone already in use by another employee" });
    }

    // Update fields if provided
    if (name) employee.name = name;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (canAddVisitor !== undefined) employee.canAddVisitor = canAddVisitor;

    await employee.save(); // Save updated employee data

    res.status(200).json({ msg: "Employee details updated successfully", employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const viewEmployeeDetails = async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      // Fetch employee details (excluding password for security)
      const employee = await Employee.findOne({ employeeId }).select('-password');
  
      if (!employee) {
        return res.status(404).json({ msg: "Employee not found" });
      }
  
      res.status(200).json({ msg: "Employee details fetched successfully", employee });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  };

  const deleteEmployee = async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      // Find and delete the employee by employeeId
      const deletedEmployee = await Employee.findOneAndDelete({ employeeId });
  
      if (!deletedEmployee) {
        return res.status(404).json({ msg: 'Employee not found' });
      }
  
      res.status(200).json({ msg: 'Employee deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Internal Server Error' });
    }
  };
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
  
  // Forgot Password Function (for Admin, Employee, and Visitor)
  
  
 
  

module.exports = { register,registerEmployee, login, editEmployee, viewEmployeeDetails,deleteEmployee,resetAdminPassword,forgotAdminPassword };