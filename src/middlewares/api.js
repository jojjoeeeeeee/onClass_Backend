const express = require('express');
const router = express.Router();
require('../db');


router.use('/auth', require('../routes/auth'));
router.use('/class', require('../routes/classes'))

module.exports = router;
