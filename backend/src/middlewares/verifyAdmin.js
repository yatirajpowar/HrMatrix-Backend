const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "COMPANY_ADMIN" && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

export default verifyAdmin;
