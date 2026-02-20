import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      process.env.JWT_SECRET || "wedding-secret-2026",
      (err, user) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Invalid or expired token",
          });
        }

        req.user = user;
        next();
      }
    );
  } else {
    res.status(401).json({
      success: false,
      message: "Authorization header missing",
    });
  }
};
