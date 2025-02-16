const express = require('express')
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use(bodyparser.json())
app.use(cors());

const adminRoutes = require('./routes/adminRoute');
const visitorRoutes = require('./routes/visitorRoute');
const employeeRoutes = require('./routes/employeeRoute');

app.use('/api/admin', adminRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/employee', employeeRoutes);


mongoose.connect('mongodb+srv://kanishka:poorani05@cluster05.pgwmpx4.mongodb.net/FaceRecognition').then(()=>{
    console.log('MongoDB Connected');
})

app.set('view engine','ejs');

app.listen(8000,()=>{
    console.log('Server running on port 8000');
})