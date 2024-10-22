const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');



module.exports = (app) => {
    
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'views')));
};