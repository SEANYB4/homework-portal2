const express = require('express');
const bcrypt = require('bcrypt');
const { User, Course } = require('./models');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/signup', async (req, res) => {

    try {
        const { username, password, role  } = req.body;
        const courses = [];

        if (!['teacher', 'student'].includes(role)) {

            return res.status(400).send('Invalid role specified');
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).send('Username already taken');
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User ({
            username,
            password: hashedPassword,
            role,
            courses
        });

        await user.save();
        res.redirect('/login'); // Redirect to login page after signup
    } catch (error) {

        console.error('Signup failed', error);
        res.status(500).send('Error signing up');
    }
});




router.post('/login', async (req, res) => {
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
        req.session.role = user.role;

        res.cookie('username', user.username, { httpOnly: false, secure: false });

        res.cookie('role', user.role, { httpOnly: false, secure: false });


        res.redirect('/'); // Redirect to a protected route after login
    } catch (error) {
        console.error('Login error', error);
        res.status(500).send('Error loggin in');
    }
});





router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.clearCookie('username')
        res.redirect('/');

        
    });
});




module.exports = router;