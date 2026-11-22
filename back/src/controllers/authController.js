const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const generateAndStoreTokens = async (user, res) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.refreshTokenHash = refreshTokenHash;
  await user.save({ validateBeforeSave: false });

  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, userName } = req.body;
    const finalName = name || userName;

    if (!finalName || !email || !password) {
      return res.status(400).json({
        msg: "Please provide all required fields (name, email, password)",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        msg: "User already exists with this email",
      });
    }

    const user = new User({
      name: finalName,
      email,
      role: "user",
    });

    await user.setPassword(password);
    await user.save();

    await generateAndStoreTokens(user, res);

    return res.status(201).json({
      msg: "Signed up successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    await generateAndStoreTokens(user, res);

    return res.status(200).json({
      msg: "Signed in successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const userId = req.userId;
    const loggedInUser = await User.findById(userId);

    if (!loggedInUser) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    return res.status(200).json({
      msg: "Found the user",
      loggedInUser,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/me (Update user profile)
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ msg: "Email is already in use by another account" });
      }
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: "Please provide current and new password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ msg: "New password must be at least 8 characters" });
    }

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }

    await user.setPassword(newPassword);
    await user.save();

    return res.status(200).json({
      success: true,
      msg: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        msg: "Refresh token is required",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({
        msg: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.userId).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({
        msg: "Session expired or revoked. Please sign in again.",
      });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid refresh token",
      });
    }

    await generateAndStoreTokens(user, res);

    return res.status(200).json({
      msg: "Access token refreshed successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await User.findByIdAndUpdate(decoded.userId, {
          $unset: { refreshTokenHash: 1 },
        });
      } catch {
        // Token was invalid or expired, continue clearing cookies
      }
    }

    res.clearCookie("accessToken", {
      ...cookieOptions,
      path: "/",
    });

    res.clearCookie("refreshToken", {
      ...cookieOptions,
      path: "/",
    });

    return res.status(200).json({
      msg: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
