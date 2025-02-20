const Employee = require('../models/Employee'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const EntryLog = require('../models/Entrylog');

const loginEmployee = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required' });
        }

        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found' });
        }

        const validPassword = await bcrypt.compare(password, employee.password);
        if (!validPassword) {
            return res.status(400).json({ msg: 'Invalid password' });
        }

        const token = jwt.sign(
            { employeeId: employee.employeeId, role: employee.role }, 
            'secretJWTkey', 
            { expiresIn: '24h' } 
        );

        res.status(200).json({
            msg: 'Login successful',
            token, 
            employeeId: employee.employeeId, 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

const nodemailer = require('nodemailer');


const sendPasswordResetEmail = async (email, token, name) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS  
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <h3>Hello ${name},</h3>
                <p>We received a request to reset your password. Below is your password reset token:</p>
                <p><strong>${token}</strong></p>
                <p>Go to <a href="${process.env.FRONTEND_URL}/reset">this link</a> and enter the token to reset your password.</p>
                <p>This token will expire in 1 hour.</p>
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


  const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Please enter your email address.' });
        }

        const user = await Admin.findOne({ email }) || await Employee.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'No user found with this email address.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.secretJWTkey, { expiresIn: '1h' });

        await sendPasswordResetEmail(email, token, user.fullName || user.name);

        res.status(200).json({ message: 'A password reset token has been sent to your email.' });

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
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.secretJWTkey);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired token.' });
        }

        let user;
        if (decoded.role === 'Admin') {
            user = await Admin.findById(decoded.id);
        } else if (decoded.role === 'Employee') {
            user = await Employee.findById(decoded.id);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

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
        console.log(req.user); 
        const employee = await Employee.findOne({ employeeId: req.user.employeeId });

        if (!employee) {
            return res.status(404).json({ msg: "Employee not found." });
        }

        console.log("Employee email:", employee.email); 

        const { faceEmbeddings } = req.body;

        if (!Array.isArray(faceEmbeddings) || faceEmbeddings.length === 0 || faceEmbeddings.length > 10) {
            return res.status(400).json({ msg: "Face embeddings must be an array with 1-10 values." });
        }

        employee.faceEmbeddings = faceEmbeddings;
        employee.hasFaceEmbeddings = true;
        await employee.save(); 

        res.status(200).json({ msg: "Face embeddings updated successfully." });
    } catch (error) {
        console.error("Error updating face embeddings:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const normalize = (embedding) => {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
};

const isMatch = (inputEmbeddings, storedEmbeddings, threshold = 1.0) => {
    return inputEmbeddings.some(inputEmbedding => {
        const normalizedInput = normalize(inputEmbedding);

        return storedEmbeddings.some(storedEmbedding => {
            const normalizedStored = normalize(storedEmbedding);

            const distance = Math.sqrt(
                normalizedInput.reduce((sum, val, i) => sum + Math.pow(val - normalizedStored[i], 2), 0)
            );

            console.log(`Distance: ${distance}`);
            return distance < threshold;
        });
    });
};

const haversineDistance = (coords1, coords2) => {
    const toRad = (angle) => (Math.PI / 180) * angle;
    const R = 6371e3; 

    const lat1 = toRad(coords1[1]), lon1 = toRad(coords1[0]);
    const lat2 = toRad(coords2[1]), lon2 = toRad(coords2[0]);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};


const markAttendance = async (req, res) => {
    try {
        const { faceEmbedding, isLive, livenessConfidence, phoneDetected, spoofAttempt, deviceId, location } = req.body;
        const employeeId = req.user?.employeeId;

        if (!employeeId || !faceEmbedding || livenessConfidence === undefined || phoneDetected === undefined || spoofAttempt === undefined) {
            return res.status(400).json({ msg: "Invalid request data." });
        }

        const employee = await Employee.findOne({ employeeId });
        if (!employee) return res.status(404).json({ msg: "Employee not found." });

        if (!isMatch(faceEmbedding, employee.faceEmbeddings)) {
            return res.status(401).json({ msg: "Face does not match." });
        }

        // const COMPANY_LOCATION = [77.5946, 12.9716]; 
        // const MAX_DISTANCE_METERS = 100;

        // const distance = haversineDistance(location.coordinates, COMPANY_LOCATION);
        // if (distance > MAX_DISTANCE_METERS) {
        //     return res.status(400).json({ msg: "You are outside the company premises. Attendance not allowed!" });
        // }

        if (!isLive || livenessConfidence < 0.7 || phoneDetected || spoofAttempt) {
            if (spoofAttempt) {
                const admins = await Admin.find(); 
                admins.forEach((admin) => {
                    sendSpoofAlertEmail(admin.email, employee.name, deviceId, location);
                });
            }
            return res.status(400).json({ msg: "Liveness check failed. Possible spoof attempt detected!" });
        }

       

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0); 

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let entryLog = await EntryLog.findOne({
            employeeId,
            entryTime: { $gte: todayStart, $lte: todayEnd }, 
        });

        if (!entryLog) {
            entryLog = new EntryLog({
                employeeId,
                deviceId,
                location,
                entryTime: new Date(), 
                isLive,
                livenessConfidence,
                phoneDetected,
                spoofAttempt,
                hasCheckedIn: true,
            });
            await entryLog.save();
            return res.status(200).json({ msg: "Attendance marked successfully!" });
        }

        if (!entryLog.exitTime) {
            entryLog.exitTime = new Date();
            await entryLog.save();
            return res.status(200).json({ msg: "Exit logged successfully!" });
        }

        return res.status(400).json({ msg: "You have already checked out for today." });

    } catch (error) {
        console.error("Error marking attendance:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const sendSpoofAlertEmail = async (adminEmail, employeeName, deviceId, location) => {
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
        to: adminEmail,
        subject: "⚠️ Spoof Attempt Detected in Attendance System",
        html: `
          <h3>Security Alert: Spoof Attempt Detected</h3>
          <p><strong>Employee Name:</strong> ${employeeName}</p>
          <p><strong>Device ID:</strong> ${deviceId}</p>
          <p><strong>Location:</strong> ${location?.coordinates?.[1]}, ${location?.coordinates?.[0]}</p>
          <p><strong>Action Required:</strong> Please review the entry logs and take necessary actions.</p>
          <p>Best regards,</p>
          <p>Security System</p>
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log(`Spoof attempt alert sent to ${adminEmail}`);
    } catch (error) {
      console.error("Error sending spoof alert email:", error);
    }
  };
  

const viewEmployeeDetails = async (req, res) => {
    try {
        const employeeId = req.user?.employeeId; 

        if (!employeeId) {
            return res.status(401).json({ msg: "Unauthorized access." });
        }

        const employee = await Employee.findOne({ employeeId }).select("-password -faceEmbeddings");
        if (!employee) {
            return res.status(404).json({ msg: "Employee not found." });
        }

        res.status(200).json(employee);
    } catch (error) {
        console.error("Error fetching employee details:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

const editEmployeeDetails = async (req, res) => {
  try {
      const employeeId = req.user?.employeeId; 
      const { name, department, designation, email, phone,  canAddVisitors } = req.body;

      if (!employeeId) {
          return res.status(401).json({ msg: "Unauthorized access." });
      }

      const employee = await Employee.findOne({ employeeId });

      if (!employee) {
          return res.status(404).json({ msg: "Employee not found." });
      }

      if (phone && phone !== employee.phone) {
          const existingPhone = await Employee.findOne({ phone });
          if (existingPhone) {
              return res.status(400).json({ msg: "Phone number already in use by another employee." });
          }
      }

      if (email && email !== employee.email) {
          const existingEmail = await Employee.findOne({ email });
          if (existingEmail) {
              return res.status(400).json({ msg: "Email already in use by another employee." });
          }
      }

      employee.name = name || employee.name;
      employee.department = department || employee.department;
      employee.designation = designation || employee.designation;
      employee.email = email || employee.email;
      employee.phone = phone || employee.phone;
      employee.canAddVisitors = canAddVisitors !== undefined ? canAddVisitors : employee.canAddVisitors;
      employee.updatedAt = new Date();

      await employee.save();

     
      const updatedEmployee = await Employee.findOne({ employeeId }).select('-faceEmbeddings -password');
      res.status(200).json({ msg: "Employee details updated successfully.",updatedEmployee });
  } catch (error) {
      console.error("Error updating employee details:", error);
      res.status(500).json({ msg: "Internal Server Error" });
  }
};


module.exports = { loginEmployee, updateFaceEmbeddings,forgotPassword,resetPassword,markAttendance,viewEmployeeDetails, editEmployeeDetails};
