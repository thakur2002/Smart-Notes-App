const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const authenticate = require('../middlewares/authenticate');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout',authController.logout);
module.exports = router;
