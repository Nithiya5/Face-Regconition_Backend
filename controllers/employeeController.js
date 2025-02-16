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

module.exports = { loginEmployee };
