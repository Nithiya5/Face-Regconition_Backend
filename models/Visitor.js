const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    contactInfo: { type: String },

    // Stores multiple entry & exit times for each visit
    visitHistory: [{
        entryTime: { type: Date, required: true, default: Date.now },
        exitTime: { type: Date }
    }],

    // Automatically calculates total visits
    totalVisits: { 
        type: Number, 
        default: 0 
    },

    // Reference Employee using employeeId instead of ObjectId
    hostEmployeeId: { type: String, required: true, ref: 'Employee' },  

    // Cloudinary URL for profile image
    profileImage: { type: String }
});

VisitorSchema.pre('save', function(next) {
    this.totalVisits = this.visitHistory.length;
    next();
});

module.exports = mongoose.model('Visitor', VisitorSchema);
