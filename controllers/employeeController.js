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



const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Please enter your email address.' });
        }

        const employee = await Employee.findOne({ email });

        if (!employee) {
            return res.status(404).json({ error: 'No employee found with this email address.' });
        }

        // Generate reset token
        const token = jwt.sign({ id: employee._id }, process.env.secretJWTkey, { expiresIn: '1h' });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>Hello ${employee.name},</p>
                   <p>Click the link below to reset your password:</p>
                   <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                      Reset Password
                   </a>
                   <p>This link will expire in 1 hour.</p>`
        };

        await transporter.sendMail(mailOptions);

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

        const employee = await Employee.findById(decoded.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        employee.password = hashedPassword;
        await employee.save();

        res.status(200).json({ message: 'Password has been successfully reset.' });

    } catch (err) {
        console.error('Error in reset-password:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { loginEmployee,forgotPassword,resetPassword };
