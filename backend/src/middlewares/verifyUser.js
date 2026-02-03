import jwt from "jsonwebtoken";

const verifyUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Token not provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // attach decoded user info - map 'id' to 'user_id' for consistency
    req.user = {
      user_id: decoded.id,
      role: decoded.role,
      company_id: decoded.company_id,
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

export default verifyUser;
