const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const AuthController = require('../controllers/AuthController');

router.post('/register', AuthController.register);
router.get('/loginSession', jwt.verify, AuthController.loginSession);

module.exports = router;