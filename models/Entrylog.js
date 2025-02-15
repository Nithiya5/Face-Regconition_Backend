const mongoose = require('mongoose');

// Entry Log Schema
const EntryLogSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    deviceId: { type: String }, 
    location: { type: String },
    imageCaptured: { type: String }, // Base64 or URL of captured image
    isLive: { type: Boolean, default: false }, // True if liveness detected
    livenessConfidence: { type: Number }, // Confidence score of liveness detection
    phoneDetected: { type: Boolean, default: false },  // True if phone screen is detected
    spoofAttempt: { type: Boolean, default: false }, // True if spoofing is suspected
    glareDetected: { type: Boolean, default: false }, // Detects glare from screens
    edgeDetected: { type: Boolean, default: false }, // Detects strong edges indicating phone usage
    moirePatternDetected: { type: Boolean, default: false } // Detects moire patterns from screens
});

const EntryLog = mongoose.model('EntryLog', EntryLogSchema);

module.exports = EntryLog;