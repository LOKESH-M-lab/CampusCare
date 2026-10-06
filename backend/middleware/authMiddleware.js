const jwt = require("jsonwebtoken");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return token && token.trim() ? token.trim() : null;
}

function verifyAdmin(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first."
      });
    }

    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured."
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required."
      });
    }

    req.admin = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login. Please login again."
    });
  }
}

function verifyStudent(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Student login required."
      });
    }

    const jwtSecret = (process.env.JWT_SECRET || "").trim();
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured."
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (decoded.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Student access required."
      });
    }

    req.student = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired student session. Please login again."
    });
  }
}

function authenticateOptional(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const jwtSecret = (process.env.JWT_SECRET || "").trim();
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        if (decoded.role === "admin") req.admin = decoded;
        if (decoded.role === "student") req.student = decoded;
      }
    }
  } catch (e) {
    // Optional auth - continue without user
  }
  next();
}

verifyAdmin.verifyAdmin = verifyAdmin;
verifyAdmin.verifyStudent = verifyStudent;
verifyAdmin.authenticateOptional = authenticateOptional;

module.exports = verifyAdmin;