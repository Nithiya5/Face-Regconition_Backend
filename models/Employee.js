const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    faceEmbeddings: { 
        type: [[Number]],   // Array of arrays of numbers (each embedding is a 128-length array)
        required: true,
        validate: [arrayLimit, 'Cannot store more than 10 embeddings per person'] // Limit the number of embeddings per employee (optional)
    }, 
    profileImage: { type: String },
    canAddVisitors: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

function arrayLimit(val) {
  return val.length <= 10; // Optional validation to limit the number of embeddings
}

const Employee = mongoose.model('Employee', EmployeeSchema);

module.exports = Employee;