const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course } = require('./models');


const router = express.Router();
router.use(express.json());


// protect certain routes from non-logged in users

const requireLogin = (req, res, next) => {
    
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};





router.get('/user/:userID', async (req, res) => {


    const { userID } = req.params;
    const user = await User.find({ username: userID });


    if (user) {

        res.json(user);
    } else {

        res.status(404).send({ message: 'User not found'});
    }
})


router.post('/updateUser/:userID', async (req, res) => {

    const { userID } = req.params;
    const { username, role } = req.body;

    try {
        const user = await User.findOne({ username: userID });

        if (user) {
            user.username = username;
        }
    
        await user.save()
    
        res.cookie('username', username, { httpOnly: false, secure: false })
        res.status(200).send("User updated successfully.");

    } catch(err) {

        console.error("Error updating user: ", err);
        res.status(500).send("User update failed.");
    }
    
});


router.get('/students', async (req, res) => {

    try {
        const students = await User.find({});
        res.json(students);
    } catch (error) {

        console.error('Failed to retrieve students: ', error);
        res.status(500).send('Error fetching students')
    }
})

module.exports = router;