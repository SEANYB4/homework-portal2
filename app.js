const express = require('express');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { rmSync } = require('fs');
const session = require('express-session');
const path = require('path');
const { User, Course, UploadedFile, sessionStore } = require('./models.js');
const middlewares = require('./middleware.js');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;


// Import routes

const fileRoutes = require('./fileRoutes.js');
const userRoutes = require('./userRoutes.js');
const courseRoutes = require('./courseRoutes.js');
const authenticationRoutes = require('./authenticationRoutes.js');
const quizRoutes = require('./quizes.js');

app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 10
    }
}));

// Middleware to parse JSON bodies
app.use(express.json());



const quizAnswers = { q1: 'A', q2: 'A', q3: 'A', q4: 'A', q5: 'A', q6: 'A', q7: 'A', q8: 'A', q9: 'A', q10: 'C'};


middlewares(app);


app.use(bodyParser.urlencoded({ extended: true }));

// // Specify the folder where your static files are located
app.use(express.static(path.join(__dirname, 'views')));

app.use(fileRoutes);
app.use(userRoutes);
app.use(courseRoutes);
app.use(authenticationRoutes);
app.use(quizRoutes);




app.get('/', (req, res) => {


    res.sendFile(path.join(__dirname, 'views/index.html'));
});


app.get('/login', (req, res) => {


    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/signup.html'));
})



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
})



