const express = require('express');
const router = express.Router();
const {registerUser, loginUser, userRefreshToken, logoutUser} = require('../controllers/identity_controller');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', userRefreshToken);
router.post('/logout', logoutUser);

module.exports = router;