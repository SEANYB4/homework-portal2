require('dotenv').config();
const express = require('express');

const bcrypt = require('bcrypt');

const mongoose = require('mongoose');

const session = require('express-session');

const MongoDBStore = require('connect-mongodb-session')(session);



const multer = require('multer');
const bodyParser = require('body-parser');


const cors = require('cors');
const path = require('path');
const { rmSync } = require('fs');


const app = express();
const PORT = process.env.PORT || 3000;


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const mongoUrl = 'mongodb+srv://artemis45566:Kraiklin1@cluster0.m2t45.mongodb.net/file_uploads?retryWrites=true&w=majority&appName=Cluster0/file_uploads'; // Add the database name in the URI

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Failed to connect to MongoDB', err));




const sessionStore = new MongoDBStore({
    uri: 'mongodb+srv://artemis45566:Kraiklin1@cluster0.m2t45.mongodb.net/file_uploads?retryWrites=true&w=majority&appName=Cluster0/file_uploads',
    collection: 'sessions'
});


app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 10
    }
}));



const fileSchema = new mongoose.Schema({
    fileContent: Buffer,
    contentType: String,
    fileName: String,
    metaData: Object,
    username: String
}, { collection: 'files' }); 


const UploadedFile = mongoose.model('UploadedFile', fileSchema);


const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});



const User = mongoose.model('User', userSchema);












app.use(bodyParser.urlencoded({ extended: true }));

// Specify the folder where your static files are located
app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {


    res.sendFile(path.join(__dirname, 'views/index.html'));
});


app.get('/login', (req, res) => {


    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/signup.html'));
})





app.post('/signup', async (req, res) => {

    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).send('Username already taken');
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User ({
            username,
            password: hashedPassword
        });

        await user.save();
        res.redirect('/login'); // Redirect to login page after signup
    } catch (error) {

        console.error('Signup failed', error);
        res.status(500).send('Error signing up');
    }
});






app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {

        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {

            return res.status(401).send('Invalid credentials');
        }


        // Creating a session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.cookie('username', user.username, { httpOnly: false, secure: false });


        res.redirect('/'); // Redirect to a protected route after login
    } catch (error) {
        console.error('Login error', error);
        res.status(500).send('Error loggin in');
    }
});



// protect certain routes from non-logged in users

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};


app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.clearCookie('username')
        res.redirect('/');

        
    });
});




app.post('/upload', requireLogin, upload.single('file'), (req, res) => {

    const file = req.file;
    const meta = req.body;


    const newFile = new UploadedFile({
        fileContent: file.buffer,
        contentType: file.mimetype,
        fileName: file.originalname,
        metaData: meta,
        username: req.session.username
    });



    newFile.save()
        .then(() => res.status(200).send("File uploaded successfully."))
        .catch(err => res.status(500).send("File upload failed."));

});



// Route to download a file by ID
app.get('/download/:id', async (req, res) => {
    
    try {

        const file = await UploadedFile.findById(req.params.id);
        if (!file) {
            return res.status(404).send('File not found');
        }
        res.set({
            'Content-Type': file.contentType,
            'Content-Disposition': `attachment; filename="${file.fileName}"`
        });
        res.send(file.fileContent);
    } catch (error) {
        console.error('Error retrieving file:', error);
    }
});


// Route to get a list of files
app.get('/files', async (req, res) => {


    if (req.session.username != 'admin') {
        try {
            const files = await UploadedFile.find({ username: req.session.username }, 'fileName username _id').lean();
            res.json(files);
        } catch (error) {
            console.error('Failed to retrieve files:', error);
            res.status(500).send('Error fetching file list');
        }

    } else {


        try {
            const files = await UploadedFile.find({}, 'fileName username _id').lean();
            res.json(files);
        } catch (error) {
            console.error('Failed to retrieve files:', error);
            res.status(500).send('Error fetching file list');
        }


    }
    

    

});




app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
})



