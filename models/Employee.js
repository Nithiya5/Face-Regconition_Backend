const mongoose = require('mongoose');

// Employee Schema
const EmployeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    faceEmbeddings: { 
        type: [Array], 
        required: true, 
        validate: [arrayLimit, 'Cannot store more than 10 embeddings per person']
    }, // Store multiple facial embeddings
    profileImage: { type: String }, // URL or base64 of employee image
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

function arrayLimit(val) {
  return val.length <= 10; // Limit the number of embeddings per person
}

const Employee = mongoose.model('Employee', EmployeeSchema);

module.exports = Employee;