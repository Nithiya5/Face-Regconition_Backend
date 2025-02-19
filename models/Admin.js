const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    role: { type: String, enum: ['admin', 'employee'], default: 'admin' }, // Changed roles

    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;

// const mongoose = require('mongoose');

// const AdminSchema = new mongoose.Schema({
//     username: { type: String, required: true, unique: true },
//     password: { 
//         type: String, 
//         required: true, 
//         validate: {
//             validator: function(value) {
//                 return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
//             },
//             message: 'Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character.'
//         }
//     },
//     fullName: { type: String, required: true },
//     email: { 
//         type: String, 
//         required: true, 
//         unique: true, 
//         match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.']
//     },
//     role: { type: String, enum: ['admin', 'employee'], default: 'admin' },
//     createdAt: { type: Date, default: Date.now }
// });

// const Admin = mongoose.model('Admin', AdminSchema);

// module.exports = Admin;

