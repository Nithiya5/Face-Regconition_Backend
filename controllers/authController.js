const getUserDetails = async (req, res) => {
    try {
        console.log(req.user); // Log the req.user object to verify the data structure

        // If the user is an admin, use userId, else use employeeId for employee
        const userDetails = req.user.role === 'admin'
            ? { userId: req.user.userId, role: req.user.role }
            : { employeeId: req.user.employeeId, role: req.user.role };

        res.json(userDetails); // Respond with user details

    } catch (error) {
        console.error("Error in getUserDetails:", error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getUserDetails };
