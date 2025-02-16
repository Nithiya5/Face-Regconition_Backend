// const jwt = require('jsonwebtoken');

// const auth = async (req, res, next) => {
//     try {
//         // Get the token from Authorization header
//         const token = req.header('Authorization')?.split(" ")[1];  // Added optional chaining for safety
//         if (!token) {
//             return res.status(401).json({ error: "Token required" });
//         }

//         // Verify the token using the secret key
//         const decoded = jwt.verify(token, "secretJWTkey");

//         // Attach decoded user info to the request object for later use in routes
//         req.user = decoded.userId;  // Corrected `decoded.userid` to `decoded.userId` (based on your JWT creation code)

//         // Proceed to the next middleware or route handler
//         next();
//     } catch (error) {
//         console.log(error);
//         return res.status(401).json({ error: "Invalid token" });
//     }
// }

// module.exports = auth;

const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        // Get the token from Authorization header
        const token = req.header('Authorization')?.split(" ")[1];  // Added optional chaining for safety
        if (!token) {
            return res.status(401).json({ error: "Token required" });
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, "secretJWTkey");

        // Attach the decoded user info (including userId and role) to the request object
        req.user = decoded;  // Attach the entire decoded token info

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = auth;

