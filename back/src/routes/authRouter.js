const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { signupSchema, signinSchema } = require("../schemas/authSchema");

router.get("/me", authMiddleware, authController.getMe);
router.patch("/me", authMiddleware, authController.updateProfile);
router.patch("/update-password", authMiddleware, authController.updatePassword);

router.post("/signup", validate(signupSchema), authController.register);
router.post("/signin", validate(signinSchema), authController.signin);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);

module.exports = router;
