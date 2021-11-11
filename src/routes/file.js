const express = require('express');
const router = express.Router();
const jwt = require('../jwt');

const FileController = require('../controllers/FileController');


router.post('/upload', jwt.verify, FileController.upload);
router.post('/upload/img', jwt.verify, FileController.uploadImage);

router.get('/download/:file_id', jwt.verify, FileController.download);


module.exports = router;