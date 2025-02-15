const mongoose = require('mongoose');

// Visitor Schema (Optional Feature)
const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    contactInfo: { type: String },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    hostEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Employee being visited
    faceEmbeddings: { 
        type: [Array], 
        required: false,
        validate: [arrayLimit, 'Cannot store more than 10 embeddings per visitor']
    }, // Store multiple facial embeddings
    imageCaptured: { type: String }, // Path or base64 of visitor image
    isLive: { type: Boolean, default: false }, // True if liveness detected
    livenessConfidence: { type: Number }, // Confidence score of liveness detection
    phoneDetected: { type: Boolean, default: false }, // True if phone screen is detected
    spoofAttempt: { type: Boolean, default: false } // True if spoofing is suspected
});

module.exports = mongoose.model('Visitor', VisitorSchema);