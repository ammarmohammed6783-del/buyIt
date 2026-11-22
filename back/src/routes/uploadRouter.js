const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/restrictTo");
const { uploadToCloudinary } = require("../utils/cloudinary");

router.post(
  "/",
  authMiddleware,
  restrictTo("admin"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          msg: "Please provide an image file to upload",
        });
      }

      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );

      return res.status(200).json({
        success: true,
        msg: "Image uploaded successfully",
        image: uploadResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
