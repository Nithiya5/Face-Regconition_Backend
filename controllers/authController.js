const getUserDetails = async (req, res) => {
    try {
      // Check user role and return corresponding user identifier
      const userDetails = req.user.role === 'admin' 
        ? { userId: req.user.userId, role: req.user.role }
        : { employeeId: req.user.employeeId, role: req.user.role };
  
      res.json(userDetails);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };
  
  module.exports = { getUserDetails };
  