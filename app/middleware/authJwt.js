const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let role of roles) {
        if (role.name === "admin") {
          next();
          return;
        }
      }
      res.status(403).send({ message: "Require Admin Role!" });
    });
  });
};

const isEmployee = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let role of roles) {
        if (role.name === "employee") {
          next();
          return;
        }
      }
      res.status(403).send({ message: "Require Employee Role!" });
    });
  });
};

const isIntern = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let role of roles) {
        if (role.name === "intern") {
          next();
          return;
        }
      }
      res.status(403).send({ message: "Require Intern Role!" });
    });
  });
};

module.exports = {
  verifyToken,
  isAdmin,
  isEmployee,
  isIntern,
};
