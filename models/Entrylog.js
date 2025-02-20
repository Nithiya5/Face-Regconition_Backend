// const mongoose = require('mongoose');

// // Entry Log Schema
// const EntryLogSchema = new mongoose.Schema({
//     employeeId: { type: String, required: true },
//     entryTime: { type: Date, default: Date.now },
//     exitTime: { type: Date },
//     deviceId: { type: String }, 
//     location: { type: String },
//     // imageCaptured: { type: String }, 
//     isLive: { type: Boolean, default: false }, 
//     livenessConfidence: { type: Number }, 
//     phoneDetected: { type: Boolean, default: false },  
//     spoofAttempt: { type: Boolean, default: false }, 
//     hasCheckedIn: { type: Boolean, default: false }
//     // glareDetected: { type: Boolean, default: false }, 
//     // edgeDetected: { type: Boolean, default: false }, 
//     // moirePatternDetected: { type: Boolean, default: false } 
// });

// const EntryLog = mongoose.model('EntryLog', EntryLogSchema);

// module.exports = EntryLog;


const mongoose = require('mongoose');

// Entry Log Schema
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

// Indexing for geospatial queries
EntryLogSchema.index({ location: '2dsphere' });

const EntryLog = mongoose.model('EntryLog', EntryLogSchema);

module.exports = EntryLog;
