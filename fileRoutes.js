const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course, UploadedFile } = require('./models');
const multer = require('multer');
const mongoose = require('mongoose');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

// protect certain routes from non-logged in users
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

router.post('/upload', requireLogin, upload.single('file'), (req, res) => {

    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const file = req.file;
    const meta = req.body;

    if (!req.session.username) {
        return res.status(403).send('Session username not found.');
    }

    const newFile = new UploadedFile({
        _id: new mongoose.Types.ObjectId(), // explicitly set the id
        fileContent: file.buffer,
        contentType: file.mimetype,
        fileName: file.originalname,
        metaData: meta,
        username: req.session.username,
        course: req.body.course
    });

    newFile.save()
        .then(() => res.status(200).send("File uploaded successfully."))
        .catch(err => {
            
            res.status(500).send(err);
            console.log(err);
    });

});


router.get('/download/:fileID', requireLogin, async (req, res) => {

    try {
        const fileID = req.params.fileID;
        // fetch file

        const file = await UploadedFile.findOne({ _id: fileID })

        if (!file) {
            return res.status(404).send('File not found');
        }

        // Set headers to force the download
        res.setHeader('Content-Type', file.contentType);
        res.send(file.fileContent);

    } catch (error) {
        console.error('Filed to download the file: ', error);
        res.status(500).send('Error occurred during file download');
    }
    
})







// Route to get a list of files
router.get('/files', async (req, res) => {

    

    if (req.session.username != 'admin') {
        if (req.session.role != 'teacher') {
            try {
                // fetch files for non-admin, non-teacher users
                const files = await UploadedFile.find({ username: req.session.username });
                const user = await User.findOne({ username: req.session.username });

                let allFiles = files.slice(); // Make a copy of files


                if (user && user.courses && user.courses.length > 0) {
                    
                    let teachers = user.courses.map(course => course[0].teacher);

                    // Remove duplicate teachers
                    teachers = [...new Set(teachers)];

                    const teacherFilesPromises = teachers.map(teacher => UploadedFile.find({ username: teacher }));
                    const teacherFilesResults = await Promise.all(teacherFilesPromises);
                    teacherFilesResults.forEach(fileGroup => {

                        allFiles = allFiles.concat(fileGroup);
                    })
                }

                res.json(allFiles);
            } catch (error) {
                console.error('Failed to retrieve files:', error);
                res.status(500).send('Error fetching file list');
            }
        } else {


            try {

                const courses = await Course.find({ teacher: req.session.username });
                

                // FIND ALL FILES SUBMITTED TO THOSE COURSES
                let allFiles = [];

                for (const course of courses) {
                 
                    const filesToAdd = await UploadedFile.find({ course: course.title });
                    allFiles = allFiles.concat(filesToAdd);
                }

                res.json(allFiles);
                
            } catch (error) {
        
                console.error('Failed to retrieve courses: ', error);
                res.status(500).send('Error fetching courses');
            }
        }
        

    } else {

        try {
            const files = await UploadedFile.find({});
            res.json(files);
        } catch (error) {
            console.error('Failed to retrieve files:', error);
            res.status(500).send('Error fetching file list');
        }
    }

});












module.exports = router;