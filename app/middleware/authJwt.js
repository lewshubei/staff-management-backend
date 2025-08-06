const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const Role = db.role;

const verifyToken = async (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    req.userId = decoded.id;
    console.log("🔍 JWT - User ID set:", req.userId);

    try {
      // Get user with roles and set them in request
      const user = await User.findByPk(decoded.id, {
        include: [
          {
            model: Role,
            as: "roles",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
      });

      if (user && user.roles) {
        req.userRoles = user.roles.map((role) => role.name);
        console.log("🔍 JWT - User roles set:", req.userRoles);
      } else {
        req.userRoles = [];
        console.log("🔍 JWT - No roles found for user");
      }

      next();
    } catch (error) {
      console.error("🔍 JWT - Error getting user roles:", error);
      req.userRoles = [];
      next();
    }
  });
};

const isAdmin = async (req, res, next) => {
  try {
    console.log("🔍 JWT - Checking admin access");
    console.log("🔍 JWT - User roles:", req.userRoles);

    // Check if user has admin role
    if (req.userRoles && req.userRoles.includes("admin")) {
      console.log("🔍 JWT - Admin access granted");
      return next();
    }

    console.log("🔍 JWT - Admin access denied");
    return res.status(403).send({
      message: "Require Admin Role!",
    });
  } catch (error) {
    console.error("🔍 JWT - Error in isAdmin check:", error);
    return res.status(500).send({
      message: error.message,
    });
  }
};

const isEmployee = async (req, res, next) => {
  try {
    if (req.userRoles && req.userRoles.includes("employee")) {
      return next();
    }
    return res.status(403).send({ message: "Require Employee Role!" });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

const isIntern = async (req, res, next) => {
  try {
    if (req.userRoles && req.userRoles.includes("intern")) {
      return next();
    }
    return res.status(403).send({ message: "Require Intern Role!" });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isEmployee,
  isIntern,
};
