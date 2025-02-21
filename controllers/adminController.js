const cloudinary = require('cloudinary').v2;
const multer = require('multer'); 
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
 
 
 const register = async (req, res) => {
  try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password || !fullName) {
          return res.status(400).json({ msg: "All fields are required." });
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
          return res.status(400).json({ msg: "Invalid email format." });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
          return res.status(400).json({
              msg: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character."
          });
      }

      const adminExists = await Admin.findOne({ email });
      const employeeExists = await Employee.findOne({ email });

      if (adminExists || employeeExists) {
          return res.status(400).json({ msg: "Email already exists in Admin or Employee database." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new Admin({
          username,
          email,
          password: hashedPassword,
          fullName
      });

      await newUser.save();
      res.status(201).json({ msg: "Admin registered successfully." });
  } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ msg: "Internal Server Error" });
  }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }

        const user = await Admin.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid Password' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            'secretJWTkey', 
            { expiresIn: '24h' }
        );

        res.status(200).json({ token }); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Internal Server Error' });
    }
};


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, 
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  },
});

const upload = multer({ storage: storage }).fields([
  { name: 'image', maxCount: 1 }, 
  { name: 'faceEmbeddings' }, 
]);

const registerEmployee = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error uploading profile image' });
      }

      const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      };

      const validatePhone = (phone) => {
        const re = /^\+?[0-9]{10,15}$/;
        return re.test(phone);
      };

      try {
        const { employeeId, name, department, designation, email, phone, password, canAddVisitor } = req.body;
        let faceEmbeddings = [];

        if (!email || !validateEmail(email)) {
          return res.status(400).json({ msg: "Invalid email format." });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
          return res.status(400).json({
              msg: "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character."
          });
      }

        if (!phone || !validatePhone(phone)) {
          return res.status(400).json({ msg: "Invalid phone number." });
        }

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
          faceEmbeddings = []; 
        }

        const existingEmployee = await Employee.findOne({
          $or: [{ email }, { employeeId }, { phone }]
        });

        if (existingEmployee) {
          return res.status(400).json({ msg: "Employee ID, Email, or Phone already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const cloudinaryResponse = await cloudinary.uploader.upload(req.files.image[0].path);

        const newEmployee = new Employee({
          employeeId,
          name,
          department,
          designation,
          email,
          phone,
          password: hashedPassword,
          faceEmbeddings,  
          canAddVisitor: canAddVisitor || false,
          profileImage: cloudinaryResponse.url, 
        });

        await newEmployee.save();

        sendEmail(email, password, name);

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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
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

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    const existingUser = await Employee.findOne({
      $or: [{ email }, { phone }],
      _id: { $ne: employee._id },
    });

    if (existingUser) {
      return res.status(400).json({ msg: "Email or phone already in use by another employee" });
    }

    if (name) employee.name = name;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (canAddVisitor !== undefined) employee.canAddVisitor = canAddVisitor;

    await employee.save(); 

    res.status(200).json({ msg: "Employee details updated successfully", employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const viewEmployeeDetails = async (req, res) => {
    try {
      const { employeeId } = req.params;

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

  const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().select('-password');

        if (!employees || employees.length === 0) {
            return res.status(404).json({ msg: "No employees found" });
        }

        res.status(200).json({ msg: "Employees fetched successfully", employees });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};


  const deleteEmployee = async (req, res) => {
    try {
      const { employeeId } = req.params;

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
   

  const updateAdminDetails = async (req, res) => {
    try {
        const adminId = req.user.userId; 
        const updatedData = req.body; 

        const updatedAdmin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: updatedData },
            { new: true, runValidators: true }
        );

        if (!updatedAdmin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        res.status(200).json({ success: true, data: updatedAdmin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const submitSupportIssue = async (req, res) => {
  try {
    const { description, email, priority, category } = req.body;

    if (!description || !email || !priority || !category) {
      return res.status(400).json({ msg: "All fields (description, email, priority, category) are required." });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const supportMailOptions = {
      from: `"Support System" <${process.env.GMAIL_USER}>`,
      to: process.env.IT_SUPPORT_EMAIL, 
      subject: `New Support Issue [${priority}] - ${category}`,
      text: `A new support issue has been submitted.

Issue Description:
${description}

From: ${email}`,
      html: `<p>A new support issue has been submitted.</p>
             <p><strong>Issue Description:</strong> ${description}</p>
             <p><strong>Priority:</strong> ${priority}</p>
             <p><strong>Category:</strong> ${category}</p>
             <p><strong>User Email:</strong> ${email}</p>`,
    };

    const userMailOptions = {
      from: `"Support System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Support Issue Received",
      text: `Thank you for contacting IT Support. We have received your issue and will respond shortly.

Issue Details:
Description: ${description}
Priority: ${priority}
Category: ${category}`,
      html: `<p>Thank you for contacting IT Support. We have received your issue and will respond shortly.</p>
             <p><strong>Issue Description:</strong> ${description}</p>
             <p><strong>Priority:</strong> ${priority}</p>
             <p><strong>Category:</strong> ${category}</p>`,
    };

    await Promise.all([
      transporter.sendMail(supportMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.status(200).json({ msg: "Support issue submitted successfully. Confirmation email sent." });
  } catch (error) {
    console.error("Error submitting support issue:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

module.exports = { register,registerEmployee, login, editEmployee, viewEmployeeDetails,deleteEmployee,getAllEmployees,updateAdminDetails,submitSupportIssue  };