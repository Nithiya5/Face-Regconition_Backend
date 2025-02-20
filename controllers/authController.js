const getUserDetails = async (req, res) => {
    try {
        console.log(req.user); 

        const userDetails = req.user.role === 'admin'
            ? { userId: req.user.userId, role: req.user.role }
            : { employeeId: req.user.employeeId, role: req.user.role };

        res.json(userDetails); 

    } catch (error) {
        console.error("Error in getUserDetails:", error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { getUserDetails };
