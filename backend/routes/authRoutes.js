const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', verifyAuth, authController.getProfile);
router.get('/me', verifyAuth, authController.getProfile);
router.put('/profile', verifyAuth, authController.updateProfile);

router.get('/contacts', verifyAuth, authController.getEmergencyContacts);
router.post('/contacts', verifyAuth, authController.addEmergencyContact);
router.delete('/contacts/:id', verifyAuth, authController.removeEmergencyContact);

module.exports = router;
