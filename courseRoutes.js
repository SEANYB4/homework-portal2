const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course } = require('./models');


const router = express.Router();


// protect certain routes from non-logged in users

const requireLogin = (req, res, next) => {
    
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};




router.get('/courses', async (req, res) => {
    try {

        const courses = await Course.find({});
        res.json(courses);
    } catch (error) {

        console.error('Failed to retrieve courses: ', error);
        res.status(500).send('Error fetching courses');
    }
})


router.get('/course/:courseId', async (req, res) => {

    const { courseId } = req.params;
    const course = await Course.find({ title: courseId });

    if (course) {

        res.json(course);
    } else {
        res.status(404).send({ message: 'Course not found'});
    }
})




router.delete('/deleteCourse/:userID/:courseTitle', async (req, res) => {


    const { userID, courseTitle } = req.params;

    const user = await User.findOne({username: userID});

    

    user.courses.forEach((course) => {



        if (course[0].title == courseTitle) {


            user.courses.pop(course);
        }

    })


    console.log(user.courses);
    console.log(user);

});



// Endpoint for a teacher to create a course

router.post('/create-course', requireLogin, async (req, res) => {
    if (req.session.role !== 'teacher') {

        return res.status(403).send('Only teachers can create courses');
    }


    const { title, description } = req.body;

    const course = new Course({
        title,
        description,
        teacher: req.session.username,
        students: []
    });

    try {

        await course.save();
        res.send('Course created successfully');
    } catch (error) {

        console.error('Failed to create course', error);
        res.status(500).send('Error creating course');
    }
});




// Endpoint to assign students to a course

router.post('/assign-student', requireLogin, async (req, res) => {

    // if (req.session.role !== 'teacher') {

    //     return res.status(403).send('Only teachers can assign students');
    // }

    const { studentUsername, courseTitle } = req.body;
    

    try {

        const course = await Course.find({ title: courseTitle });
        if (!course) {
            return res.status(404).send('Course not found');
        }

        const student = await User.find({ username: studentUsername });
        if (!student) {
            return res.status(404).send('Student not found');
        }

        if (!course[0].students.includes(studentUsername)) {
            course[0].students.push(studentUsername);
            student[0].courses.push(course);
            await course[0].save();
            await student[0].save();

            res.send('Student assigned successfully');

        } else {

            res.send('Student already assigned');
        }

    } catch (error) {

        console.log('Failed to assign student', error);
        res.status(500).send('Error assigning student');
    }
});

router.get('/my-courses', requireLogin, async(req, res) => {

    const username = req.session.username;
    const user = await User.findOne({ username: username });
    const courses = user.courses;

    if (courses[0]) {
        res.json(courses.map((course) => ({

            title: course[0].title,
            description: course[0].description
        })))

    } else {

        res.status(404).send('No Courses found for current user');
    }

});




module.exports = router;