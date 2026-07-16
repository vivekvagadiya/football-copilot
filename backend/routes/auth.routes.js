const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateUserProfile, uploadUserAvatar } = require("../controller/auth.controller");
const {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
} = require("../validators/auth.validator.js");
const validateSchema = require("../validators/schema.validator.js");
const authenticate = require("../middleware/auth.middleware.js");
const upload=require('../controller/multer.js')

router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validateSchema(profileUpdateSchema), updateUserProfile);
router.post('/profile-avatar', authenticate, upload.single('avatar'), uploadUserAvatar);

module.exports = router;
