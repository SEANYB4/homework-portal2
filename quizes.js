const express = require('express');

router = express.Router();


router.post('/submit-quiz', (req, res) => {
    const responses = req.body;
    let score = 0;
    Object.keys(responses).forEach(question => {
        if (responses[question] === quizAnswers[question]) {
            score += 1;
        }
    });
    res.json({ score: score });
    
});



module.exports = router;