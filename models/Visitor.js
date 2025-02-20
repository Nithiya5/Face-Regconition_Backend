const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    contactInfo: { type: String },

    visitHistory: [{
        entryTime: { type: Date, required: true, default: Date.now },
        exitTime: { type: Date }
    }],

    totalVisits: { 
        type: Number, 
        default: 0 
    },

    hostEmployeeId: { 
        type: String, 
        required: true 
      },  

    profileImage: { type: String }
});

VisitorSchema.pre('save', function(next) {
    this.totalVisits = this.visitHistory.length;
    next();
});

module.exports = mongoose.model('Visitor', VisitorSchema);
