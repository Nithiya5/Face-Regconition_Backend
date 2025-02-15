const mongoose = require('mongoose');

// Entry Log Schema
const EntryLogSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    deviceId: { type: String }, 
    location: { type: String },
    imageCaptured: { type: String }, 
    isLive: { type: Boolean, default: false }, 
    livenessConfidence: { type: Number }, 
    phoneDetected: { type: Boolean, default: false },  
    spoofAttempt: { type: Boolean, default: false }, 
    glareDetected: { type: Boolean, default: false }, 
    edgeDetected: { type: Boolean, default: false }, 
    moirePatternDetected: { type: Boolean, default: false } 
});

const EntryLog = mongoose.model('EntryLog', EntryLogSchema);

module.exports = EntryLog;