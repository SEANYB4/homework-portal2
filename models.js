
const mongoose = require('mongoose');

const session = require('express-session');

const MongoDBStore = require('connect-mongodb-session')(session);




const mongoUrl = `mongodb+srv://artemis45566:Kraiklin1@cluster0.m2t45.mongodb.net/file_uploads?retryWrites=true&w=majority&appName=Cluster0/file_uploads`; // Add the database name in the URI

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Failed to connect to MongoDB', err));




const sessionStore = new MongoDBStore({
    uri: `mongodb+srv://artemis45566:Kraiklin1@cluster0.m2t45.mongodb.net/file_uploads?retryWrites=true&w=majority&appName=Cluster0/file_uploads`,
    collection: 'sessions'
});





const fileSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'UploadedFile' }, 
    fileContent: Buffer,
    contentType: String,
    fileName: String,
    metaData: Object,
    username: String,
    course: String,
    uploadedDate: { type: Date, default: Date.now } 
}, { collection: 'files' }); 


const UploadedFile = mongoose.model('UploadedFile', fileSchema);




// Course schema

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    teacher: { type: String, required: true },
    students: []
});


const Course = mongoose.model('Course', courseSchema);



// User Schema

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['teacher', 'student'] },
    courses: []
});

const User = mongoose.model('User', userSchema);



module.exports = { User, Course, UploadedFile, sessionStore };