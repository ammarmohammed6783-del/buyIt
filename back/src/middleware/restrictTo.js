const restrictTo = (...roles) => (req, res, next) => {
  const role = req.userRole || req.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({
      success: false,
      msg: "You do not have permission to perform this action.",
    });
  }
  next();
};

module.exports = restrictTo;
