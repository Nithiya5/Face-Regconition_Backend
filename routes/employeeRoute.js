const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { loginEmployee,updateFaceEmbeddings } = require('../controllers/employeeController'); // Import the login function

router.post('/login', loginEmployee); // POST request to /login
router.post('/update-face-embeddings', auth, updateFaceEmbeddings);


module.exports = router;
