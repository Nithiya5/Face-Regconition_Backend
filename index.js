const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const { default: mongoose } = require('mongoose');

const app = express();
app.use(bodyparser.json())
app.use(cors());

mongoose.connect('mongodb+srv://nithiyaR:nithiya@2005@cluster0.a02jqzo.mongodb.net/').then(()=>{
    console.log('MongoDB Connected');
})

app.set('view engine','ejs'); 

app.listen(8000,()=>{
    console.log('Server running on port 8000');
})