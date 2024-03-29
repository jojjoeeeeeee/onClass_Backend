const express = require('express');
const router = express.Router();
require('../db');


router.use('/auth', require('../routes/auth'));
router.use('/class', require('../routes/classes'));
router.use('/exam', require('../routes/exam'));
router.use('/file', require('../routes/file'));

module.exports = router;
