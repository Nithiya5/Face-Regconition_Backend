const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        // Get the token from Authorization header
        const token = req.header('Authorization')?.split(" ")[1]; // Safe extraction of token

        if (!token) {
            return res.status(401).json({ error: "Token required" });
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, "secretJWTkey");

        // Attach decoded user info to the request object for later use in routes
        if (decoded.role === 'admin') {
            req.user = {
                userId: decoded.userId, // Admin token will have userId
                role: decoded.role,
            };
        } else if (decoded.role === 'employee') {
            req.user = {
                employeeId: decoded.employeeId, // Employee token will have employeeId
                role: decoded.role,
            };
        }

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.log("Error in auth middleware:", error);
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = auth;
