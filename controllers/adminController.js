const cloudinary = require('cloudinary').v2;
const multer = require('multer'); // Import multer for file uploads
 // Assuming you have an Employee model
 const Employee = require('../models/Employee');
 const Admin = require('../models/Admin');
 const nodemailer = require('nodemailer');
 const jwt = require('jsonwebtoken');
 
 // or use bcryptjs if needed
 const bcrypt = require("bcryptjs");
 
 
 // Cloudinary configuration
//  Multer setup for handling file uploads
 
 

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
// const upload = multer({ dest: "uploads/" }).single("image");

const registerEmployee = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error uploading profile image' });
      }

      try {
        const { employeeId, name, department, designation, email, phone, password, canAddVisitor } = req.body;
        let faceEmbeddings = [];

        // ✅ Make faceEmbeddings Optional
        if (req.body.faceEmbeddings) {
          try {
            faceEmbeddings = JSON.parse(req.body.faceEmbeddings.trim());
            if (faceEmbeddings.length > 10) {
              return res.status(400).json({ msg: "Face embeddings must be an array with up to 10 values." });
            }
          } catch (error) {
            return res.status(400).json({ msg: "Invalid face embeddings format. Must be a valid JSON array." });
          }
        } else {
          faceEmbeddings = []; // Default to empty array if not provided
        }

        // ✅ Check for existing employee
        const existingEmployee = await Employee.findOne({
          $or: [{ email }, { employeeId }, { phone }]
        });

        if (existingEmployee) {
          return res.status(400).json({ msg: "Employee ID, Email, or Phone already exists." });
        }

        // ✅ Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ Upload profile image to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(req.files.image[0].path);

        // ✅ Save Employee in DB
        const newEmployee = new Employee({
          employeeId,
          name,
          department,
          designation,
          email,
          phone,
          password: hashedPassword,
          faceEmbeddings,  // Initially empty
          canAddVisitor: canAddVisitor || false,
          profileImage: cloudinaryResponse.url, // Cloudinary image URL
        });

        await newEmployee.save();

        // ✅ Send email with login details
        sendEmail(email, password, name);

        // ✅ Response
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



const sendEmail = async (email, password, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Employee Account Has Been Created",
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
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
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
   

module.exports = { register,registerEmployee, login, editEmployee, viewEmployeeDetails,deleteEmployee };