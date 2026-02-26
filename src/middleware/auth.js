import jwt from "jsonwebtoken";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.warn("WARNING: JWT_SECRET is not defined in environment variables!");
  }

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      secret || "temporary-dev-secret-replace-me",
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
