const mongoose = require('mongoose');

const EntryLogSchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    deviceId: { type: String }, 
    location: { 
        type: { type: String, enum: ['Point'], default: 'Point' }, 
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    isLive: { type: Boolean, default: false }, 
    livenessConfidence: { type: Number }, 
    phoneDetected: { type: Boolean, default: false },  
    spoofAttempt: { type: Boolean, default: false }, 
    hasCheckedIn: { type: Boolean, default: false }
});

EntryLogSchema.index({ location: '2dsphere' });

const EntryLog = mongoose.model('EntryLog', EntryLogSchema);

module.exports = EntryLog;
