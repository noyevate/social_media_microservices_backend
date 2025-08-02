const express = require('express')
const {searchPostController} = require("../controllers/search_controller")
const logger = require('../utils/looger');
const {authenticateRequest} = require('../middleware/auth_middleware');

const router = express.Router();

router.use(authenticateRequest);

router.get('/post', searchPostController)

module.exports = router; 


