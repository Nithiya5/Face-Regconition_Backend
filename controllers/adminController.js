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

module.exports = { register, login };
