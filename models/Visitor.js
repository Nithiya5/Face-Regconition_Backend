const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
    visitorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    contactInfo: { type: String },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    hostEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, 
    faceEmbeddings: { 
        type: [Array], 
        required: false,
        validate: [arrayLimit, 'Cannot store more than 10 embeddings per visitor']
    }, 
    imageCaptured: { type: String }, 
    isLive: { type: Boolean, default: false }, 
    livenessConfidence: { type: Number }, 
    phoneDetected: { type: Boolean, default: false }, 
    spoofAttempt: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Visitor', VisitorSchema);