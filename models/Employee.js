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
        type: [[Number]], 
        required: true, 
        validate: [arrayLimit, 'Cannot store more than 10 embeddings per person']
    }, 
    profileImage: { type: String },
    canAddVisitors: { type: Boolean, default: false },
    hasFaceEmbeddings: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

function arrayLimit(val) {
  return val.length <= 10; 
}

const Employee = mongoose.model('Employee', EmployeeSchema);

module.exports = Employee;


// const mongoose = require('mongoose');

// const EmployeeSchema = new mongoose.Schema({
//     employeeId: { type: String, required: true, unique: true },
//     name: { type: String, required: true },
//     department: { type: String, required: true },
//     designation: { type: String, required: true },
//     email: { 
//         type: String, 
//         required: true, 
//         unique: true, 
//         match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.']
//     },
//     password: { 
//         type: String, 
//         required: true
//     },
//     phone: { type: String, required: true },
//     faceEmbeddings: { 
//         type: [[Number]], 
//         required: true, 
//         validate: [arrayLimit, 'Cannot store more than 10 embeddings per person']
//     }, 
//     profileImage: { type: String },
//     canAddVisitors: { type: Boolean, default: false },
//     role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// });

// function arrayLimit(val) {
//   return val.length <= 10; 
// }

// EmployeeSchema.pre('save', function(next) {
//     if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(this.password)) {
//         console.warn('Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.');
//     }
//     next();
// });

// const Employee = mongoose.model('Employee', EmployeeSchema);

// module.exports = Employee;
